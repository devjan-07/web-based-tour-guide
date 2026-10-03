USE WebBasedTourGuideDB;
GO

/*
    VOYARA - FINAL DATABASE CLEANUP
    --------------------------------
    Purpose:
      1. Remove old/demo/test records from the current database.
      2. Preserve the current JPA schema.
      3. Preserve roles, permissions and role_permissions.
      4. Let AuthDataSeeder recreate ONLY the configured Admin account.
      5. Let DemoDataSeeder recreate the current tourism seed data.

    IMPORTANT:
      - Do NOT run the old table creation/sample-data scripts after this cleanup.
      - Back up the database first if existing data must be retained.
      - The Admin password is NOT stored here; AuthDataSeeder hashes the configured password.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @sql NVARCHAR(MAX) = N'';

    SELECT @sql = @sql +
        N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' NOCHECK CONSTRAINT ALL;' + CHAR(13) + CHAR(10)
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = N'dbo';
    EXEC sys.sp_executesql @sql;

    SET @sql = N'';
    SELECT @sql = @sql +
        N'DELETE FROM ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N';' + CHAR(13) + CHAR(10)
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = N'dbo'
      AND t.name NOT IN (N'roles', N'permissions', N'role_permissions');
    EXEC sys.sp_executesql @sql;

    SET @sql = N'';
    SELECT @sql = @sql +
        N'ALTER TABLE ' + QUOTENAME(s.name) + N'.' + QUOTENAME(t.name) + N' WITH CHECK CHECK CONSTRAINT ALL;' + CHAR(13) + CHAR(10)
    FROM sys.tables t
    INNER JOIN sys.schemas s ON s.schema_id = t.schema_id
    WHERE s.name = N'dbo';
    EXEC sys.sp_executesql @sql;

    COMMIT TRANSACTION;
    PRINT 'Voyara application data cleanup completed successfully.';
    PRINT 'Restart Spring Boot so AuthDataSeeder and DemoDataSeeder recreate the current seed data.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;
GO
