import { Search, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const Header = ({ searchTerm, setSearchTerm }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleAvatarClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (currentUser?.id) {
      navigate(`/profile/${currentUser.id}`);
    } else {
      console.warn('No valid user ID, redirecting to login');
      navigate('/login');
    }
  };

  return (
    <div className="bg-primary-700">
      <div className="relative">
        <div className="absolute inset-0">
          <img
            className="w-full h-full object-cover opacity-30"
            src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80"
            alt="Food background"
          />
        </div>
        <div className="relative max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Left side - Title */}
            <div>
              <h1 className="text-3xl font-bold text-white">
                FoodieReviews Dashboard
              </h1>
              <p className="text-white opacity-90">
                Manage and explore your culinary adventures
              </p>
            </div>

            {/* Right side - Controls */}
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Search Input */}
              <div className="relative flex-grow min-w-[180px] max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search size={18} className="text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by title, tag, author, or rating..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-transparent rounded-lg bg-white bg-opacity-20 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40"
                />
              </div>

              {/* Avatar */}
              <div
                className="flex items-center gap-2 bg-white bg-opacity-20 py-1 px-3 rounded-lg cursor-pointer hover:bg-opacity-30 transition-all"
                onClick={handleAvatarClick}
              >
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center overflow-hidden">
                  {currentUser?.avatarUrl ? (
                    <img
                      src={currentUser.avatarUrl}
                      alt={currentUser?.username || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-5 h-5 text-gray-500" />
                  )}
                </div>
                <span className="text-white font-medium truncate max-w-[100px]">
                  {currentUser?.username || "User"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Header;