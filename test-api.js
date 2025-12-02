async function testAPI() {
  try {
    const response = await fetch('http://localhost:5000/api/loans');
    const data = await response.json();
    console.log('Réponse de l\'API:');
    console.log(JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

testAPI();