import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import fs from 'fs';

// Create a Redis connection
const connection = new Redis({
    maxRetriesPerRequest: null
});

// Define a new queue
export const matchQueue = new Queue('matchQueue', {
  connection
});

const handlers: Record<string, (job: Job) => Promise<any>> = {
  matchQueue: async (job) => {
    console.info(`Processing job ${job.id} with data:`, job.data);

    return { success: true };
  }
};

export const startWorkers = async (queueNames: string[]) => {
  console.info(`[BullMQ] Initializing workers for queues: ${queueNames}`);

  for (const queueName of queueNames) {
    if (!handlers[queueName]) {
      throw new Error(`Queue handler for "${queueName}" is missing in configuration`);
    }

    console.info(`[BullMQ] Worker started for queue: ${queueName}`);

    new Worker(queueName, async (job) => {
      console.info(`Processing job in queue: ${queueName} - Job ID: ${job.id}, Data:`, job.data);

      try {
        return await handlers[queueName](job);
      } catch (error) {
        console.error(`Job ${job.id} failed:`, error);
        throw error;
      }
    }, { connection });
  }
};


export default matchQueue;