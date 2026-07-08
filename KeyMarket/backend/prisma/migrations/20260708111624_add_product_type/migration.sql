-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('GAME', 'DLC');

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "product_type" "ProductType" NOT NULL DEFAULT 'GAME';
