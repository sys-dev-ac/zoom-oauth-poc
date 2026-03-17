import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();


app.get('/auth/linkedin', (req, res) => {
  const state = Math.random().toString(36).slice(2); // or a real CSRF token
  
  console.log(process.env.LINKEDIN_REDIRECT_URI)
  
  const url = `https://www.linkedin.com/oauth/v2/authorization?` +
    `response_type=code&` +
    `client_id=${encodeURIComponent(process.env.LINKEDIN_CLIENT_ID || '')}&` +
    `redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI || '')}&` +
    `scope=${encodeURIComponent('r_liteprofile r_emailaddress')}&` +
    `state=${encodeURIComponent(state)}`;
  res.redirect(url);
});


app.get("/linkedin/callback", (req, res) => {
  const { code } = req.query;
  
  res.status(200).send({
    message: "authenticated"
  })
  
})

app.listen(8001, () => {
  console.log(`linkedin oauth server is running ${8003}`)
})

// https://www.linkedin.com/oauth/v2/authorization?%20response_type=code&%20client_id={your-client-id}&%20redirect_uri={your-redirect-uri}&%20scope=r_liteprofile%20r_emailaddress&%20state={random-state}