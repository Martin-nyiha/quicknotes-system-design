# QuickNotes Data Model

## Entities

### users
| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT NOT NULL | |
| email | TEXT NOT NULL UNIQUE | |
| created_at | TEXT NOT NULL | |

### notes
| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| user_id | INTEGER NOT NULL | Foreign key to `users.id` |
| title | TEXT NOT NULL (max 100 characters) | |
| body | TEXT | |
| created_at | TEXT NOT NULL | |

### tags
| Column | Type | Key |
|---|---|---|
| id | INTEGER | Primary key |
| name | TEXT NOT NULL UNIQUE | |

### note_tags
| Column | Type | Key |
|---|---|---|
| note_id | INTEGER NOT NULL | Foreign key to `notes.id` |
| tag_id | INTEGER NOT NULL | Foreign key to `tags.id` |
| (note_id, tag_id) | | Composite primary key |

## Relationships

- **One-to-many:** one user has many notes, and each note belongs to exactly one user (`notes.user_id`).
- **Many-to-many:** notes and tags. A note can have many tags, and a tag can be on many notes. 
The `note_tags` join table is required to model a many-to-many relationship between notes and tags. A single note can have multiple tags, and a single tag can be assigned to multiple notes. Using a dedicated join table with composite foreign keys (`note_id` and `tag_id`) normalizes the database, eliminates data redundancy, and enables efficient filtering without storing unnormalized lists or CSV strings in a single column.

## CREATE TABLE statements

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE users (
  id         INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
  id         INTEGER PRIMARY KEY,
  user_id    INTEGER NOT NULL,
  title      TEXT NOT NULL CHECK (length(title) <= 100),
  body       TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE tags (
  id   INTEGER PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE note_tags (
  note_id INTEGER NOT NULL,
  tag_id  INTEGER NOT NULL,
  PRIMARY KEY (note_id, tag_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);
```

## Example queries

```sql
-- 1. A user's notes, newest first
SELECT id, title
FROM notes
WHERE user_id = 1
ORDER BY created_at DESC, id DESC;

-- 2. JOIN: each note with its tags
SELECT notes.title, tags.name
FROM notes
JOIN note_tags ON note_tags.note_id = notes.id
JOIN tags      ON tags.id = note_tags.tag_id
WHERE notes.user_id = 1;

-- 3. How many notes each tag has
SELECT tags.name, COUNT(note_tags.note_id) AS note_count
FROM tags
LEFT JOIN note_tags ON note_tags.tag_id = tags.id
GROUP BY tags.id, tags.name;
```

## Index

```sql
CREATE INDEX idx_notes_user_id ON notes(user_id);
```

**Reason:** `GET /notes` always filters by `user_id`. Without an index, the database must perform a full table scan, checking every single note. With an index on `user_id`, the database jumps directly to that user's notes, drastically speeding up read queries. The trade-off is that write operations (`INSERT`, `UPDATE`, `DELETE`) become slightly slower because the database must update both the table and the index structure.

## SQL or NoSQL?

We chose a relational SQL database because our data is highly structured and interconnected with clear relationships between users, notes, and tags. Enforcing relational integrity—such as unique email addresses, valid foreign keys, and structured join tables for many-to-many tag mappings—is critical for this application. SQL also provides ACID compliance for consistency and allows efficient index-driven joins to support fast read operations.