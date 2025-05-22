-- CreateIndex
CREATE UNIQUE INDEX "customers_active_email_unique" ON "customers"("email") WHERE "deletedAt" IS NULL;
