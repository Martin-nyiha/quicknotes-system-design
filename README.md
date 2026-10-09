# QuickNotes System Design

# QuickNotes System Design

A QuickNotes project with a small web client that talks to a REST API (GET, POST and DELETE), plus three design documents: API design, data model and architecture for 1 million users.

## How to run the API client

1. Clone the repository: `git clone https://github.com/Martin-nyiha/quicknotes-system-design.git`
2. Open the folder in VS Code.
3. Right-click `index.html` and choose **Open with Live Server**, or open `index.html` in your browser. You need an internet connection.
4. Click **Load notes** to fetch 10 notes. You can also add and delete notes.

The client uses the practice API at `https://jsonplaceholder.typicode.com/posts`, which accepts changes but does not store them, so refreshing brings back the original notes.

## Documents

- [API design](docs/api-design.md)
- [Data model](docs/data-model.md)
- [Architecture](docs/architecture.md)

## What I learned

- **Handling HTTP API Requests:** Learned how to use `fetch` to handle REST operations (GET, POST, DELETE) and verified responses using `response.ok` to catch and handle network or server errors gracefully.
- **Relational Data Modeling:** Understood how to structure relational tables, primary keys, and join tables (many-to-many relationships) to manage complex relationships like linking notes to tags efficiently.
- **System Architecture & Scaling:** Discovered how architectural patterns—such as caching with Redis, using read replicas, and offloading heavy tasks to background workers via message queues—scale an application to support high traffic and maintain low latency.