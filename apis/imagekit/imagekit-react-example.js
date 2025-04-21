//In order to use the SDK, you need to provide it with a few configuration parameters. 
//The configuration parameters can be applied directly to the IKImage component or using 
//an IKContext component.

<IKContext
  publicKey="public_EnVZ0Y/lkcYa+Zb/GiGWCqn7qOc="
  urlEndpoint="https://ik.imagekit.io/xvpgfijuw"
  transformationPosition="path"
  authenticationEndpoint="http://www.yourserver.com/auth">

  // Image component
  <IKImage path="/default-image.jpg" transformation={[{
    "height": "300",
    "width": "400"
  }]} />

  // Image upload
  <IKUpload fileName="my-upload" />
</IKContext>