# Database Setup for SmartBi

This project uses MySQL with Drizzle ORM.

## 1. Create the database

If you have MySQL installed locally, run:

```sql
CREATE DATABASE smartbi;
```

If you prefer Docker:

```powershell
docker run --name smartbi-db -e MYSQL_ROOT_PASSWORD=root -e MYSQL_DATABASE=smartbi -p 3306:3306 -d mysql:8.0
```

## 2. Configure environment variables

Copy the example env file:

```powershell
copy .env.example .env
```

Edit `.env` and set:

```env
DATABASE_URL=mysql://<user>:<password>@localhost:3306/smartbi
```

## 3. Run migrations

```powershell
pnpm db:push
```

This applies the schema from `drizzle/schema.ts`.

## 4. Seed sample data

```powershell
pnpm db:seed
```

This script inserts example `funcionarios`, `pagamentos` and `producao` rows.

## 5. Start the app

```powershell
pnpm dev
```

## 6. Useful commands

- `pnpm db:push` — generate + apply migrations
- `pnpm db:seed` — insert sample dashboard data
- `pnpm db:setup` — run migrations then seed
