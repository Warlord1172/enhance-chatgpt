const api_key = "YOUR_API_KEY";
const text = prompt("What do you want to make?");  // prompt the user to describe what they want to make

fetch(`https://api.openai.com/v1/images/generations`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${api_key}`,
  },
  body: JSON.stringify({
    model: 'image-alpha-001',
    prompt: text,          // use the description from the user
    num_images: 1,
    size: '512x512',
    response_format: 'url'
  })
})
.then(response => response.json())
.then(data => {
  const image_url = data.data[0].url;
  const img = document.createElement('img');
  img.src = image_url;
  document.body.appendChild(img);
});