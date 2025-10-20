export default async function (request, response) {
  console.log('Proxy function was invoked!');
  response.status(200).json({ message: 'Proxy function is alive.' });
};