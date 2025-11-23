export default handler = async (req, res) =>  {
    try{
        await fetch(import.meta.env.VITE_BACKEND_URL);
        res.status(200).json({ok : true});
    }catch{
        res.status(500).json({error: "Ping Failed."})
    }
}