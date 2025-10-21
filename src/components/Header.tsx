import { Link } from 'react-router-dom';
import UserSession from './UserSession';
import logo from '@/assets/logo-knewledge-avif.avif';

const Header = () => {
  return (
    <header className="bg-gray-900 text-white shadow-md">
      <div className="container mx-auto flex items-center justify-between p-4">
        <Link to="/">
          <img src={logo} alt="Knewledge Logo" className="h-10 brightness-0 invert" />
        </Link>
        <UserSession />
      </div>
    </header>
  );
};

export default Header;
