# QuickNotes API Design

All requests and responses use JSON. Every endpoint needs the header `Authorization: Bearer <token>`, which the user gets when they log in. Paths use nouns, and the HTTP method says the action (for example `DELETE /notes/42`, not `/deleteNote`).

## Endpoints

| Method | Path | Description | Success status |
|---|---|---|---|
| GET | `/notes` | List the logged-in user's notes | 200 OK |
| GET | `/notes/{id}` | Get one note | 200 OK |
| POST | `/notes` | Create a note | 201 Created |
| PUT | `/notes/{id}` | Replace a note's title, body and tags | 200 OK |
| DELETE | `/notes/{id}` | Delete a note | 204 No Content |
| GET | `/notes?tag=study` | List notes that have a given tag | 200 OK |
| GET | `/tags` | List all tags | 200 OK |

## Example: create a note

`POST /notes`

Request body:

```json
{
  "title": "Revise HTML forms",
  "body": "Chapter 3 and the exercises",
  "tags": ["study"]
}
```

Response, `201 Created`:

```json
{
  "id": 42,
  "title": "Revise HTML forms",
  "body": "Chapter 3 and the exercises",
  "tags": ["study"],
  "created_at": "2026-10-12T09:30:00Z"
}
```

## Example: list notes

`GET /notes`

Response, `200 OK`:

```json
{
  "count": 2,
  "notes": [
    { "id": 42, "title": "Revise HTML forms", "body": "Chapter 3", "tags": ["study"], "created_at": "2026-10-12T09:30:00Z" },
    { "id": 41, "title": "Push code to GitHub", "body": "", "tags": [], "created_at": "2026-10-11T18:05:00Z" }
  ]
}
```

## Error status codes

| Status | Meaning | When it happens |
|---|---|---|
| 400 Bad Request | The request is invalid | `POST /notes` with a missing title or a title over 100 characters |
| 401 Unauthorized | Not logged in or token invalid | The `Authorization` header is missing or the token has expired |
| 403 Forbidden | Logged in but not allowed | Trying to delete a note that belongs to another user |
| 404 Not Found | The note does not exist | `GET /notes/9999` |
| 500 Internal Server Error | A server-side problem | The database is unreachable |

Example error body (all errors use the same shape):

```json
{
  "error": {
    "status": 400,
    "message": "Title is required and must be at most 100 characters"
  }
}
```