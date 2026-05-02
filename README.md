# El-Shaddai Baptist Schools - Backend API

A comprehensive School Management System built with **NestJS**, **TypeORM**, and **PostgreSQL**. This platform provides role-based access for Administrators, Teachers, and Students, handling everything from assignments and weekly academic reports to batch student enrollments.

## Features

* **Role-Based Access Control (RBAC)**: Secure endpoints restricted by user roles (Admin, Teacher, Student) using JWT Authentication.
* **Academic Structure Management**: Complete management of Academic Years, Terms, Classes (e.g., SS1), and Departments (e.g., Science, Arts).
* **Assignment Module**: 
  * Teachers can create, update, and manage assignments.
  * Students can fetch paginated assignments strictly filtered to their enrolled class.
  * Filter support for "Active" and "Past Due" statuses.
* **Weekly Reports**:
  * Teachers can log weekly academic scores and behavioral remarks for students.
  * Automatic grade and GPA calculations on a 5.0 scale.
* **Student Dashboard**: Real-time aggregated data including the student's latest active assignments and their most recent weekly report behavioral score.
* **Enrollment System**:
  * **Manual Entry**: Quick UI-driven creation of student accounts.
  * **Batch CSV Upload**: High-speed, transaction-safe parsing of CSV files (`papaparse`) to automatically generate hundreds of student profiles, map them to classes/departments, and safely hash default passwords.

## Tech Stack

* **Framework**: [NestJS](https://nestjs.com/)
* **Database**: PostgreSQL
* **ORM**: TypeORM
* **Authentication**: Passport-JWT & bcrypt
* **Validation**: class-validator & class-transformer
* **Pagination**: nestjs-paginate
* **CSV Processing**: Papaparse & Multer

## Getting Started

### Prerequisites
* Node.js (v18+)
* PostgreSQL Database

### Installation

```bash
$ npm install
```

### Environment Variables
Create a `.env` file in the root directory and configure the following variables:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/elshaddai_db
JWT_SECRET=your_super_secret_jwt_key
PORT=3000
```

### Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Core Architecture Highlights

### Transactional Safety
Critical bulk operations (like the Student CSV Batch Upload) are wrapped in strict TypeORM QueryRunner transactions. If a single row out of 200 contains an error (e.g., an invalid class name or duplicate username), the entire operation rolls back to prevent fragmented database states, returning the exact row error to the client.

### Relational Mapping
The system leverages complex TypeORM relations (`OneToOne`, `ManyToOne`, `OneToMany`) to tightly couple authenticable `User` accounts to highly detailed `Student` and `Teacher` profiles, which are themselves linked dynamically to `SchoolClass` and `Department` entities.

## License

This project is proprietary and intended solely for use by El-Shaddai Baptist Schools.
