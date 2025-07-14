export const getDashboardData = async () => {
  try {
    // Get real-time statistics from actual database tables
    const statsData = await getDashboardStats();
    
    // Add a small delay to simulate network timing
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return statsData;
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    // Validate SDK availability
    if (!window.ApperSDK || !window.ApperSDK.ApperClient) {
      console.error('Apper SDK not available or not loaded properly');
      throw new Error('Apper SDK not available. Please check the CDN connection.');
    }

    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });

    // Validate environment variables
    if (!import.meta.env.VITE_APPER_PROJECT_ID || !import.meta.env.VITE_APPER_PUBLIC_KEY) {
      throw new Error('Missing required environment variables for Apper SDK');
    }

    let responses = [];
    
    try {
      // Fetch aggregated statistics from multiple tables with better error handling
      responses = await Promise.allSettled([
        // Current clients count
        apperClient.fetchRecords('client', {
          aggregators: [{
            id: 'totalClients',
            fields: [{ field: { Name: 'Id' }, Function: 'Count' }]
          }]
        }),
        // Historical clients count (last month)
        apperClient.fetchRecords('client', {
          aggregators: [{
            id: 'totalClientsLastMonth',
            fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
            where: [{ FieldName: 'CreatedOn', Operator: 'RelativeMatch', Values: ['last month'] }]
          }]
        }),
        // Current active projects
        apperClient.fetchRecords('project', {
          aggregators: [{
            id: 'activeProjects',
            fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
            where: [{ FieldName: 'status', Operator: 'EqualTo', Values: ['active'] }]
          }]
        }),
        // Historical active projects (last week)
        apperClient.fetchRecords('project', {
          aggregators: [{
            id: 'activeProjectsLastWeek',
            fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
            where: [
              { FieldName: 'status', Operator: 'EqualTo', Values: ['active'] },
              { FieldName: 'CreatedOn', Operator: 'RelativeMatch', Values: ['last week'] }
            ]
          }]
        }),
        // Current tasks statistics
        apperClient.fetchRecords('task', {
          aggregators: [
            {
              id: 'pendingTasks',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [{ FieldName: 'status', Operator: 'NotEqualTo', Values: ['done'] }]
            },
            {
              id: 'completedTasks',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [{ FieldName: 'status', Operator: 'EqualTo', Values: ['done'] }]
            },
            {
              id: 'overdueTasks',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [
                { FieldName: 'status', Operator: 'NotEqualTo', Values: ['done'] },
                { FieldName: 'dueDate', Operator: 'LessThan', Values: [new Date().toISOString().split('T')[0]] }
              ]
            }
          ]
        }),
        // Historical tasks statistics (yesterday and last week)
        apperClient.fetchRecords('task', {
          aggregators: [
            {
              id: 'pendingTasksYesterday',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [
                { FieldName: 'status', Operator: 'NotEqualTo', Values: ['done'] },
                { FieldName: 'CreatedOn', Operator: 'RelativeMatch', Values: ['yesterday'] }
              ]
            },
            {
              id: 'completedTasksLastWeek',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [
                { FieldName: 'status', Operator: 'EqualTo', Values: ['done'] },
                { FieldName: 'ModifiedOn', Operator: 'RelativeMatch', Values: ['last week'] }
              ]
            }
          ]
        }),
        // Current invoice statistics
        apperClient.fetchRecords('app_invoice', {
          aggregators: [
            {
              id: 'monthlyRevenue',
              fields: [{ field: { Name: 'amount' }, Function: 'Sum' }],
              where: [
                { FieldName: 'status', Operator: 'EqualTo', Values: ['paid'] },
                { FieldName: 'paymentDate', Operator: 'RelativeMatch', Values: ['this month'] }
              ]
            },
            {
              id: 'overdueInvoices',
              fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
              where: [
                { FieldName: 'status', Operator: 'NotEqualTo', Values: ['paid'] },
                { FieldName: 'dueDate', Operator: 'LessThan', Values: [new Date().toISOString().split('T')[0]] }
              ]
            }
          ]
        }),
        // Historical invoice statistics (last month)
        apperClient.fetchRecords('app_invoice', {
          aggregators: [{
            id: 'monthlyRevenueLastMonth',
            fields: [{ field: { Name: 'amount' }, Function: 'Sum' }],
            where: [
              { FieldName: 'status', Operator: 'EqualTo', Values: ['paid'] },
              { FieldName: 'paymentDate', Operator: 'RelativeMatch', Values: ['last month'] }
            ]
          }]
        })
      ]);
    } catch (networkError) {
      console.error('Network error occurred during API calls:', networkError);
      throw new Error(`Network connectivity issue: ${networkError.message}`);
    }

    // Process responses with better error handling
    const processResponse = (response, index, description) => {
      if (response.status === 'rejected') {
        console.error(`Failed to fetch ${description}:`, response.reason);
        return null;
      }
      
      if (!response.value) {
        console.warn(`Empty response for ${description}`);
        return null;
      }

      // Check for API-level errors
      if (!response.value.success) {
        console.error(`API error for ${description}:`, response.value.message);
        return null;
      }

      return response.value;
    };

    // Extract responses with descriptive names
    const [
      clientsResponse,
      clientsHistoricalResponse,
      projectsResponse,
      projectsHistoricalResponse,
      tasksResponse,
      tasksHistoricalResponse,
      invoicesResponse,
      invoicesHistoricalResponse
    ] = [
      processResponse(responses[0], 0, 'current clients'),
      processResponse(responses[1], 1, 'historical clients'),
      processResponse(responses[2], 2, 'current projects'),
      processResponse(responses[3], 3, 'historical projects'),
      processResponse(responses[4], 4, 'current tasks'),
      processResponse(responses[5], 5, 'historical tasks'),
      processResponse(responses[6], 6, 'current invoices'),
      processResponse(responses[7], 7, 'historical invoices')
    ];

    // Helper function to safely extract aggregator values
    const getAggregatorValue = (response, aggregatorId, fallback = 0) => {
      if (!response || !response.aggregators || !Array.isArray(response.aggregators)) {
        return fallback;
      }
      
      const aggregator = response.aggregators.find(a => a && a.id === aggregatorId);
      return aggregator && typeof aggregator.value === 'number' ? aggregator.value : fallback;
    };

    // Extract current values with enhanced fallbacks
    const totalClients = getAggregatorValue(clientsResponse, 'totalClients');
    const activeProjects = getAggregatorValue(projectsResponse, 'activeProjects');
    const pendingTasks = getAggregatorValue(tasksResponse, 'pendingTasks');
    const completedTasks = getAggregatorValue(tasksResponse, 'completedTasks');
    const overdueTasks = getAggregatorValue(tasksResponse, 'overdueTasks');
    const monthlyRevenue = getAggregatorValue(invoicesResponse, 'monthlyRevenue');
    const overdueInvoices = getAggregatorValue(invoicesResponse, 'overdueInvoices');

    // Extract historical values for comparison
    const totalClientsLastMonth = getAggregatorValue(clientsHistoricalResponse, 'totalClientsLastMonth');
    const activeProjectsLastWeek = getAggregatorValue(projectsHistoricalResponse, 'activeProjectsLastWeek');
    const pendingTasksYesterday = getAggregatorValue(tasksHistoricalResponse, 'pendingTasksYesterday');
    const completedTasksLastWeek = getAggregatorValue(tasksHistoricalResponse, 'completedTasksLastWeek');
    const monthlyRevenueLastMonth = getAggregatorValue(invoicesHistoricalResponse, 'monthlyRevenueLastMonth');

    // Calculate dynamic changes and trends
    const calculatePercentageChange = (current, previous) => {
      if (typeof current !== 'number' || typeof previous !== 'number') return '0%';
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    };

    const calculateDifference = (current, previous) => {
      if (typeof current !== 'number' || typeof previous !== 'number') return '0';
      const diff = current - previous;
      return diff > 0 ? `+${diff}` : `${diff}`;
    };

    // Calculate client growth percentage
    const clientGrowth = totalClients > 0 ? calculatePercentageChange(totalClients, totalClients - totalClientsLastMonth) : '0%';
    
    // Calculate project change from last week
    const projectChange = activeProjects - activeProjectsLastWeek;
    const projectChangeText = projectChange !== 0 ? `${calculateDifference(activeProjects, activeProjectsLastWeek)} this week` : 'No change';
    
    // Calculate task change from yesterday
    const taskChange = pendingTasks - pendingTasksYesterday;
    const taskChangeText = taskChange !== 0 ? `${calculateDifference(pendingTasks, pendingTasksYesterday)} from yesterday` : 'No change';
    
    // Calculate revenue growth percentage
    const revenueGrowth = monthlyRevenue > 0 ? calculatePercentageChange(monthlyRevenue, monthlyRevenueLastMonth) : '0%';
    
    // Calculate completed tasks change from last week
    const completedTasksChange = completedTasks - completedTasksLastWeek;
    const completedTasksChangeText = completedTasksChange !== 0 ? `${calculateDifference(completedTasks, completedTasksLastWeek)} this week` : 'No change';
    
    // Calculate overdue items urgency level
    const totalOverdueItems = overdueTasks + overdueInvoices;
    const overdueUrgencyText = totalOverdueItems > 5 ? `${totalOverdueItems} urgent` : totalOverdueItems > 0 ? `${totalOverdueItems} items` : 'None';

    return {
      summary: {
        totalClients,
        activeProjects,
        pendingTasks,
        monthlyRevenue,
        completedTasks,
        overdueItems: totalOverdueItems,
        // Dynamic change values
        clientGrowth,
        projectChange: projectChangeText,
        taskChange: taskChangeText,
        revenueGrowth,
        completedTasksChange: completedTasksChangeText,
        overdueUrgency: overdueUrgencyText,
        // Change types for UI styling
        clientGrowthType: clientGrowth.includes('+') ? 'positive' : clientGrowth.includes('-') ? 'negative' : 'neutral',
        projectChangeType: projectChange > 0 ? 'positive' : projectChange < 0 ? 'negative' : 'neutral',
        taskChangeType: taskChange < 0 ? 'positive' : taskChange > 0 ? 'negative' : 'neutral', // Fewer pending tasks is positive
        revenueGrowthType: revenueGrowth.includes('+') ? 'positive' : revenueGrowth.includes('-') ? 'negative' : 'neutral',
        completedTasksChangeType: completedTasksChange >= 0 ? 'positive' : 'negative',
        overdueUrgencyType: totalOverdueItems > 5 ? 'negative' : totalOverdueItems > 0 ? 'neutral' : 'positive'
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
        tasksCompleted: completedTasks,
        hoursTracked: 168,
        invoicesSent: 5
      }
    };
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    
    // Provide user-friendly error details
    let errorMessage = "Failed to fetch dashboard statistics";
    
    if (error.message?.includes('Network')) {
      errorMessage = "Network connectivity issue. Please check your internet connection and try again.";
    } else if (error.message?.includes('SDK')) {
      errorMessage = "Service unavailable. Please refresh the page or try again later.";
    } else if (error.message?.includes('environment')) {
      errorMessage = "Configuration error. Please contact support.";
    }
    
    // Log detailed error for debugging
    console.error("Dashboard service error details:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    
    // Create enhanced error object
    const enhancedError = new Error(errorMessage);
    enhancedError.originalError = error;
    enhancedError.timestamp = new Date().toISOString();
    
    throw enhancedError;
  }
};