import { redirect } from 'next/navigation';

const HomeRedirect = () => {
    redirect('/home');
    return null; // Tidak perlu render apa-apa setelah redirect
};

export default HomeRedirect;
