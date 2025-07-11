import React, { useState, useContext } from "react";
import Button from "@/components/atoms/Button";
import ThemeToggle from "@/components/molecules/ThemeToggle";
import ApperIcon from "@/components/ApperIcon";
import { useSidebar } from "@/hooks/useSidebar";
import { AuthContext } from "../../App";
import ProjectModal from "@/components/molecules/ProjectModal";

const Header = () => {
  const { toggleSidebar } = useSidebar();
  const { logout } = useContext(AuthContext);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const handleProjectSubmit = async (projectData) => {
    // Modal handles the submission and toast notifications
    setIsProjectModalOpen(false);
  };

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleSidebar}
            className="lg:hidden p-2"
          >
            <ApperIcon name="Menu" size={20} />
          </Button>
          
          <div className="lg:hidden flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
              <ApperIcon name="Briefcase" size={16} className="text-white" />
            </div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
              ClientFlow Pro
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:flex">
            <ApperIcon name="Bell" size={18} className="text-gray-600 dark:text-gray-300" />
          </Button>
          
          <ThemeToggle />
          
          <Button 
            variant="primary" 
            size="sm" 
            className="hidden sm:flex"
            onClick={() => setIsProjectModalOpen(true)}
          >
            <ApperIcon name="Plus" size={16} className="mr-2" />
            New Project
          </Button>

          <Button 
            variant="outline" 
            size="sm"
            onClick={logout}
            className="flex items-center gap-2"
          >
            <ApperIcon name="LogOut" size={16} />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
      
      <ProjectModal
        isOpen={isProjectModalOpen}
        onClose={() => setIsProjectModalOpen(false)}
        onSubmit={handleProjectSubmit}
      />
    </header>
  );
};

export default Header;