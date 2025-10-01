-- CreateTable
CREATE TABLE "public"."NgrokTunnel" (
    "id" TEXT NOT NULL DEFAULT 'ngrok-url',
    "url" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NgrokTunnel_pkey" PRIMARY KEY ("id")
);
