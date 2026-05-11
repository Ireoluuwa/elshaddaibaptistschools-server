# Teacher Portal: Assignments API Consumption

This guide details how to implement the assignment management module for teachers.

## 1. Create Assignment
Used by teachers to post new assignments to a specific class.

- **Endpoint:** `POST /assignments`
- **Roles:** `TEACHER`
- **Payload Structure:**
```json
{
  "title": "Algebra Basics",
  "description": "Solve quadratic equations from page 45.",
  "startDate": "2026-05-10T08:00:00Z",
  "dueDate": "2026-05-15T16:00:00Z",
  "classId": "class-uuid",
  "attachmentUrl": "https://storage.example.com/files/algebra.pdf" // Optional
}
```

---

## 2. List My Assignments
Fetches a paginated list of assignments.

- **Endpoint:** `GET /assignments`
- **Roles:** `TEACHER`
- **Logic:** This endpoint is now **self-aware**. It automatically extracts your Teacher ID from the login session and only returns assignments created by you.
- **Query Params (Pagination/Filtering):**
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 10)
  - `search`: Search by title or description
  - `filter.status`: Filter by status (e.g., Active, Past Due) if implemented.
- **Response Structure:**
```json
{
  "data": [
    {
      "id": "assignment-uuid",
      "title": "Algebra Basics",
      "startDate": "...",
      "dueDate": "...",
      "attachmentUrl": "..."
    }
  ],
  "meta": {
    "totalItems": 25,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 3,
    "currentPage": 1
  }
}
```

---

## 3. Update Assignment
Teachers can only update assignments they created.

- **Endpoint:** `PATCH /assignments/:id`
- **Roles:** `TEACHER`
- **Payload:** Any field from the Create payload (Partial).

---

## 4. Delete Assignment
Teachers can only delete assignments they created.

- **Endpoint:** `DELETE /assignments/:id`
- **Roles:** `TEACHER`

---

## 5. Get Assignment Details
Fetches full details including the assigned class.

- **Endpoint:** `GET /assignments/:id`
- **Response Example:**
```json
{
  "id": "uuid",
  "title": "...",
  "description": "...",
  "startDate": "...",
  "dueDate": "...",
  "teacher": { "firstName": "...", "lastName": "..." },
  "schoolClass": { "id": "...", "name": "SS2 Science" }
}
```
