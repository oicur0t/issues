# Migration to Project System

## Overview

The application now supports organizing issues into projects with project-specific numbering (e.g., CUS-001, CUS-002).

## For Existing Deployments

If you have existing issues in your database, you need to run the migration script to:
1. Create a default "General" project (key: GEN)
2. Assign all existing issues to this project
3. Generate issue numbers (GEN-001, GEN-002, etc.)

## Running the Migration

### Option 1: Using Docker

```bash
# Enter your running container
docker compose exec app sh

# Run the migration
npm run migrate:projects
```

### Option 2: Local Development

```bash
# Make sure your environment variables are set
npm run migrate:projects
```

### Option 3: Manual Docker Command

```bash
docker compose exec app npm run migrate:projects
```

## What the Migration Does

1. **Checks existing data**: Counts projects and issues needing migration
2. **Creates default project**: If no "GEN" project exists, creates one
3. **Assigns issues**: Updates all issues without projectId to use the default project
4. **Generates numbers**: Assigns issue numbers in order of creation date (GEN-001, GEN-002, etc.)
5. **Updates counter**: Sets the project's issue counter correctly

## After Migration

You can:
- Visit `/projects` to see your projects
- Create new projects at `/projects/new`
- View existing issues with their GEN-XXX numbers
- Create new issues and assign them to any project

## Creating New Projects

As an admin:
1. Go to `/projects/new`
2. Enter:
   - **Name**: Full project name (e.g., "Customer Portal")
   - **Key**: 2-5 uppercase letters (e.g., "CUS")
   - **Description**: Optional description
3. New issues in this project will be numbered CUS-001, CUS-002, etc.

## Project Requirements

- Project keys must be 2-5 uppercase letters
- Project keys must be unique
- Projects cannot be deleted if they have issues

## Troubleshooting

If the migration fails:
- Ensure MongoDB is running and accessible
- Check that at least one admin user exists
- Verify MONGODB_URI environment variable is set correctly

To re-run the migration:
- The script is safe to run multiple times
- It will skip issues that already have projects
