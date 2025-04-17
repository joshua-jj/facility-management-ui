import { useRouter } from 'next/router';
import { useEffect } from 'react';
// import axios from 'axios';

const VerifyUser = () => {
  const router = useRouter();
  const { email, token } = router.query;
  // const [loading, setLoading] = useState(true);
  // const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (email) {
      // const data = {
      //   token: token,
      //   email: email,
      // };
      // const verifyUserAction: VerifyUserAction = {
      //   type: userConstants.VERIFY_EMAIL,
      //   payload: data,
      // };
      // dispatch(verifyUserAction as unknown as UnknownAction);
    }
    // const verifyUser = async () => {
    //     if (!email || !token) return;

    //     try {
    //         setLoading(true);
    //         setError(null);

    //         // Replace with your API endpoint
    //         const response = await axios.post('/api/verify-user', { email, token });

    //         if (response.status === 200) {
    //             router.push('/dashboard'); // Redirect to the desired page
    //         } else {
    //             setError('Verification failed. Please try again.');
    //         }
    //     } catch (err) {
    //         setError('An error occurred during verification.');
    //     } finally {
    //         setLoading(false);
    //     }
    // };

    // verifyUser();
  }, [email, token, router]);

  // if (loading) {
  //     return <p>Verifying your account...</p>;
  // }

  // if (error) {
  //     return <p>{error}</p>;
  // }

  return null;
};

export default VerifyUser;
