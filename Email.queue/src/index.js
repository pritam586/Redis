import express from 'express';
import Redis from 'ioredis';

const app = express();
app.use(express.json());

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

const QUEUE_KEY = 'email:queue';

app.post('/email' , async(req , res)=>{
    const job = {
        to: req.body.to,
        subject: req.body.subject|| "No Subject",
        body: req.body.body || "No Body",
        createdAt: new Date().toISOString()
    }
    await redis.lpush(QUEUE_KEY, JSON.stringify(job));
    res.json({ queued: true, job });
})

app.get('/email/process-one', async(req , res)=>{
    const rawjob = await redis.rpop(QUEUE_KEY);
    if (!rawjob) {
        return res.status(404).json({ error: 'No email job available' });
    }
    res.json({ job: JSON.parse(rawjob) });
});

app.listen(3000, () => {
    console.log('Email queue server is running on http://localhost:3000');
});