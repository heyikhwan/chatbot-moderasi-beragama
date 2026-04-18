-- AlterTable
ALTER TABLE `user` MODIFY `updateAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateTable
CREATE TABLE `chat` (
    `id` VARCHAR(191) NOT NULL,
    `chatSessionId` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `role` ENUM('user', 'bot') NOT NULL,
    `sentiment` ENUM('positif', 'negatif', 'netral') NULL DEFAULT 'positif',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Chat_chatSessionId_fkey`(`chatSessionId`),
    INDEX `Chat_chatSessionId_createdAt_idx`(`chatSessionId`, `createdAt`),
    INDEX `Chat_chatSessionId_sentiment_idx`(`chatSessionId`, `sentiment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `chatSession` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `deletedAt` DATETIME(0) NULL,
    `title` VARCHAR(191) NOT NULL,

    INDEX `ChatSession_userId_fkey`(`userId`),
    INDEX `ChatSession_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat` ADD CONSTRAINT `Chat_chatSessionId_fkey` FOREIGN KEY (`chatSessionId`) REFERENCES `chatSession`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chatSession` ADD CONSTRAINT `ChatSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
