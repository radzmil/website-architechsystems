# Digital marketplace catalog

The public `/marketplace` page reads up to 100 active products from `marketplace_products` in PostgreSQL on each request. It selects only id, name, description and price_sen; it never reads or displays delivery_url. Inactive products are hidden. Checkout and automatic delivery are not implemented.

Configure `DATABASE_URL` for the website deployment and point it to the **same PostgreSQL database** used by the local admin-panel. For local development, set it in the website's ignored `.env`; for Vercel, set it as a project environment variable and redeploy. The hosting network must be able to reach the database, and the database account should have SELECT-only access to marketplace_products where possible. Do not commit database credentials. The local admin-panel must remain private.

The table is defined in `D:\Architech Systems\admin-panel\schema.sql`. Check the target database before running `apply_schema.py` from that admin-panel; this changes the schema. To publish a product, save it there with the active checkbox selected. Refresh `/marketplace` to see the latest catalog. If no database is configured or the table is missing, the public page displays an unavailable message instead of sample products.

Run `python -m unittest discover -p 'test_*.py' -q` from this website directory to test the catalog and existing features.