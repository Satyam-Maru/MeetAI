import jwt from 'jsonwebtoken';

function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ message: 'Unauthorized', success: false });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        console.log(`err: ${err}`)
        res.status(403).json({ message: 'Forbidden', success: false });
    }
}

export { verifyToken }