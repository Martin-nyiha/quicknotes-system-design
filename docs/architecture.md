# QuickNotes Architecture

## Requirements

### Functional
- Users can log in.
- Users can create, view, edit and delete notes.
- Users can tag notes and filter notes by tag.

### Non-functional
- **Availability:** about 99.9% uptime.
- **Latency:** `GET /notes` in under 200 ms for 95% of requests.
- **Scalability:** supports 1 million users.
- **Durability:** a saved note is never lost.
- **Security:** HTTPS everywhere, with token-based login.

## Load estimate for 1 million users

```
Assumptions: 1,000,000 registered users, 20% active daily = 200,000 DAU
             each active user creates 5 notes and loads notes 20 times a day
             1 day is about 100,000 seconds, peak is 5x the average

Writes:   200,000 x 5  = 1,000,000 per day  ->  about 10 writes per second (peak ~50)
Reads:    200,000 x 20 = 4,000,000 per day  ->  about 40 reads per second (peak ~200)
Storage:  1,000,000 notes x 500 bytes = 500 MB per day  ->  about 180 GB per year
```

The system is read-heavy (about 4 times more reads than writes).

## Architecture diagram

```
  ┌───────────────┐   DNS lookup    ┌─────────┐
  │ Client        │ ──────────────> │   DNS   │
  │ (browser)     │                 └─────────┘
  └───┬───────┬───┘
      │       │  static files (HTML, CSS, JS)
      │       v
      │   ┌─────────┐
      │   │   CDN   │
      │   └─────────┘
      │ API calls (HTTPS, JSON)
      v
  ┌───────────────┐
  │ Load balancer │
  └───────┬───────┘
    ┌─────┴──────┬────────────┐
    v            v            v
┌───────┐    ┌───────┐    ┌───────┐   ┌───────────────┐
│ App 1 │    │ App 2 │    │ App 3 │──>│ Cache (Redis) │
└───┬───┘    └───┬───┘    └───┬───┘   └───────────────┘
    │ writes     │ reads      │ jobs
    v            v            v
┌─────────┐  ┌──────────┐  ┌───────┐   ┌────────┐
│ Primary │─>│ Read     │  │ Queue │──>│ Worker │
│   DB    │  │ replica  │  └───────┘   └────────┘
└─────────┘  └──────────┘
```

## What each component does
- **DNS:** Solves the problem of users needing to memorize IP addresses by resolving human-readable domain names into server IP addresses.
- **CDN:** Solves the problem of high latency for geographically distant users by caching static files (HTML, CSS, JS) closer to them at edge locations.
- **Load balancer:** Solves the problem of a single server being overloaded or failing by distributing incoming API traffic across multiple app servers.
- **App servers:** Solve the problem of handling core application logic and API endpoints, kept stateless so any server can handle any user request.
- **Cache:** Solves the problem of the primary database being overwhelmed by frequent read requests by storing active user note lists in memory for fast retrieval.
- **Primary DB:** Solves the problem of needing reliable, persistent data storage by handling all data modifications and serving as the single source of truth.
- **Read replica:** Solves the problem of high read traffic on the primary database by offloading read queries and providing a real-time data backup.
- **Queue:** Solves the problem of slow background tasks blocking user requests by holding jobs asynchronously until they can be processed.
- **Worker:** Solves the problem of executing resource-intensive or asynchronous tasks by picking up jobs from the queue and running them in the background.

## Request flows

### GET /notes
1. The client sends `GET /notes` with its token to the load balancer.
2. The load balancer sends it to a healthy app server.
3. The server checks the token and looks in the cache for that user's notes.
4. On a cache hit, it returns the cached list. On a miss, it reads from a replica, stores the result in the cache with an expiry time, and returns it.
5. The response is `200 OK` with the notes as JSON.

### POST /notes
1. The client sends `POST /notes` with the JSON body to the load balancer.
2. The load balancer sends it to a healthy app server.
3. The server validates the data (a title is required, at most 100 characters).
4. It writes the note to the primary database.
5. It deletes that user's cached note list so the next read is fresh.
6. It adds any slow follow-up job (such as sending a notification) to the queue for a worker.
7. It returns `201 Created` with the new note.

## Trade-offs

- **Trade-off:** Cache speed vs. stale data. **Gain:** Serving notes from Redis significantly lowers latency and reduces database read load. **Cost:** A user might briefly see outdated notes if a write operation fails to invalidate the cache immediately.
- **Trade-off:** Read replicas vs. replication lag. **Gain:** Scales read throughput to easily handle peak load while serving as a failover backup. **Cost:** Replication lag between the primary database and replicas can cause temporary inconsistencies when fetching newly created notes.

## Avoiding single points of failure

- **App servers:** several identical, stateless servers, so one failing loses nothing, and the load balancer's health checks stop sending traffic to it.
- **Load balancer:** run more than one, or use a managed service.
- **Database:** the read replica can be promoted to primary if the primary fails.
- **Cache:** if it fails, the app falls back to the database (slower but working).
- **Queue:** jobs are stored until a worker completes them, and workers can be restarted.
- **CDN and DNS:** both are made of many servers spread across locations.