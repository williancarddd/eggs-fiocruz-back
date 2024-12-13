-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "f_name" TEXT NOT NULL,
    "l_name" TEXT,
    "email" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
