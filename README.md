# 🚀 Asset Manager Web App

A full-stack asset management system built for the Eport (Pvt) Ltd developer interview challenge.
This application allows **Admins** and **Users** to manage organizational assets with role-based access control, using **Next.js**, **Supabase**, **PostgreSQL**, and **Vercel** CI/CD auto-deployment.

## 📌 Features

### 🔐 Authentication & Authorization
* Email/password signup & login using **Supabase Auth**
* `profiles` table stores user roles: `admin` or `user`
* Role-based dashboards:
  * **Admin Dashboard**
  * **User Dashboard**

### 👨‍💼 Admin Capabilities

Admins can:
* ✅ Create new **Users**
* 🔄 Update a user’s **role** (User ↔ Admin)
* 🏷️ Create **Asset Categories**
* 🏢 Create **Departments**
* 🗑️ Delete any existing **Asset**
* 👥 View the list of all users (email + role)
* 📋 View all assets in the system

### 👤 User Capabilities
Users can:
* ✏️ Create new **Assets**
* 👀 View **only assets they created** (privacy by design)
* Asset fields include:
  * Asset Name
  * Category
  * Department
  * Date Purchased
  * Cost

## 🏗️ Tech Stack
| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | **Next.js 14 (App Router)**         |
| Backend          | **Supabase** (Auth + PostgreSQL DB) |
| Styling          | **Tailwind CSS**                    |
| Deployment       | **Vercel**                          |
| Database Hosting | **Supabase PostgreSQL**             |
| CI/CD            | GitHub → Vercel auto-deployment     |

## 📂 Database Schema

### `profiles`
Stores user metadata and roles.
| Column     | Type                   |
| ---------- | ---------------------- |
| id         | uuid (FK → auth.users) |
| full_name  | text                   |
| role       | admin/user             |
| created_at | timestamptz            |

### `categories`
| Column | Type |
| ------ | ---- |
| id     | uuid |
| name   | text |

### `departments`
| Column | Type |
| ------ | ---- |
| id     | uuid |
| name   | text |

### `assets`
| Column         | Type                    |
| -------------- | ----------------------- |
| id             | uuid                    |
| asset_name     | text                    |
| category_id    | uuid                    |
| department_id  | uuid                    |
| date_purchased | date                    |
| cost           | numeric                 |
| created_by     | uuid (FK → profiles.id) |

## ⚙️ Running the App Locally

### 1. Clone the repository
```bash
git clone https://github.com/<your-username>/asset-manager.git
cd asset-manager
```

### 2. Install dependencies
```bash
npm install
```

### 3. Add environment variables (`.env.local`)
Create `.env.local` in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Start the development server
```bash
npm run dev
```

Visit
👉 [http://localhost:3000](http://localhost:3000)

## 🔐 Setting Up Supabase

### 1. Create a project on Supabase

Copy your API URL + public anon key.

### 2. Create required tables

Run the following SQL in the Supabase SQL editor:
```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text check (role in ('admin','user')) default 'user',
  created_at timestamp default now()
);

create table categories (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table departments (
  id uuid primary key default gen_random_uuid(),
  name text not null
);

create table assets (
  id uuid primary key default gen_random_uuid(),
  asset_name text not null,
  category_id uuid references categories(id),
  department_id uuid references departments(id),
  date_purchased date not null,
  cost numeric(12,2) not null,
  created_by uuid references profiles(id),
  created_at timestamp default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.email, 'user');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute procedure public.handle_new_user();
```

### 3. Promote your account to Admin
After signing up once:

```sql
update profiles
set role = 'admin'
where full_name = 'your-email@example.com';
```

## 🚀 Deployment (Vercel)

### 1. Push the project to GitHub

```bash
git add .
git commit -m "Deploy Asset Manager"
git push
```

### 2. On Vercel:

* Create new project → Import from GitHub
* Add environment variables:

  * `NEXT_PUBLIC_SUPABASE_URL`
  * `NEXT_PUBLIC_SUPABASE_ANON_KEY`
* Deploy

### 3. Test auto-deployment

Push any new commit:

```bash
git commit -m "UI update"
git push
```

Vercel will automatically redeploy.

## 🧪 CI/CD Testing (for Eport Team)

This application supports:

* Automated GitHub → Vercel deployments
* Write access for reviewers to push changes
* Automatic rebuild & redeployment on each git push
