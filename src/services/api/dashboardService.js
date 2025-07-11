export const getDashboardData = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Get dashboard data using aggregation queries
    const params = {
      fields: [
        { field: { Name: "summary" } },
        { field: { Name: "recentActivity" } },
        { field: { Name: "quickStats" } }
      ]
    };
    
    const response = await apperClient.fetchRecords('dashboard', params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    // Return mock data structure for now since dashboard is complex
    // In a real implementation, this would aggregate data from multiple tables
    return {
      summary: {
        totalClients: 24,
        activeProjects: 8,
        pendingTasks: 47,
        monthlyRevenue: 12450,
        completedTasks: 156,
        overdueItems: 3
      },
      recentActivity: [
        {
          id: 1,
          type: "project",
          title: "Project 'Website Redesign' marked as completed",
          client: "TechCorp Inc",
          time: "2 hours ago",
          icon: "CheckCircle2"
        },
        {
          id: 2,
          type: "task",
          title: "New task assigned: 'Review wireframes'",
          client: "StartupXYZ",
          time: "4 hours ago",
          icon: "Plus"
        },
        {
          id: 3,
          type: "invoice",
          title: "Invoice #1247 sent to client",
          client: "Digital Agency",
          time: "6 hours ago",
          icon: "FileText"
        },
        {
          id: 4,
          type: "client",
          title: "New client 'Fashion Brand' added",
          client: "Fashion Brand",
          time: "1 day ago",
          icon: "UserPlus"
        },
        {
          id: 5,
          type: "payment",
          title: "Payment received from TechCorp Inc",
          client: "TechCorp Inc",
          time: "2 days ago",
          icon: "DollarSign"
        }
      ],
      quickStats: {
        projectsThisWeek: 3,
        tasksCompleted: 24,
        hoursTracked: 168,
        invoicesSent: 5
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};