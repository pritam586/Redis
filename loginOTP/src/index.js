import express from 'express';
import Redis from 'ioredis';

const app = express();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

app.use(express.json());

function optKey(phone){
    return `otp:${phone}`;
}

app.post('/otp', async (req, res) => {
    const { phone } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000);
    await redis.set(optKey(phone), otp, 'EX', 30); 
    res.json({ message: 'OTP sent successfully', otp });
});

app.post('/verify-otp', async (req, res) => {
    const { phone, otp } = req.body;
    const storedOtp = await redis.get(optKey(phone));
    if(!storedOtp) {
        return res.status(400).json({ message: 'OTP expired or not found' });
    }
    if(storedOtp !== otp) {
        return res.status(400).json({ message: 'Invalid OTP' });
    }

    await redis.del(optKey(phone));
    res.json({ message: 'OTP verified successfully' });
});

app.get('/otp/:phone/ttl', async (req, res) => {
    const ttl = await redis.ttl(optKey(req.params.phone));

    res.json({ ttl });
});

app.listen(3000, () => {
    console.log('Server is running on port http://localhost:3000');
});


