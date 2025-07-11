export const getDashboardData = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Fetch aggregated statistics from multiple tables
// Fetch current and historical data for comparison
    const [
      clientsResponse, clientsHistoricalResponse,
      projectsResponse, projectsHistoricalResponse,
      tasksResponse, tasksHistoricalResponse,
      invoicesResponse, invoicesHistoricalResponse
    ] = await Promise.all([
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

    // Extract current values with fallbacks
    const totalClients = clientsResponse?.aggregators?.find(a => a.id === 'totalClients')?.value || 0;
    const activeProjects = projectsResponse?.aggregators?.find(a => a.id === 'activeProjects')?.value || 0;
    const pendingTasks = tasksResponse?.aggregators?.find(a => a.id === 'pendingTasks')?.value || 0;
    const completedTasks = tasksResponse?.aggregators?.find(a => a.id === 'completedTasks')?.value || 0;
    const overdueTasks = tasksResponse?.aggregators?.find(a => a.id === 'overdueTasks')?.value || 0;
    const monthlyRevenue = invoicesResponse?.aggregators?.find(a => a.id === 'monthlyRevenue')?.value || 0;
    const overdueInvoices = invoicesResponse?.aggregators?.find(a => a.id === 'overdueInvoices')?.value || 0;

    // Extract historical values for comparison
    const totalClientsLastMonth = clientsHistoricalResponse?.aggregators?.find(a => a.id === 'totalClientsLastMonth')?.value || 0;
    const activeProjectsLastWeek = projectsHistoricalResponse?.aggregators?.find(a => a.id === 'activeProjectsLastWeek')?.value || 0;
    const pendingTasksYesterday = tasksHistoricalResponse?.aggregators?.find(a => a.id === 'pendingTasksYesterday')?.value || 0;
    const completedTasksLastWeek = tasksHistoricalResponse?.aggregators?.find(a => a.id === 'completedTasksLastWeek')?.value || 0;
    const monthlyRevenueLastMonth = invoicesHistoricalResponse?.aggregators?.find(a => a.id === 'monthlyRevenueLastMonth')?.value || 0;

    // Calculate dynamic changes and trends
    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? '+100%' : '0%';
      const change = ((current - previous) / previous) * 100;
      return change > 0 ? `+${change.toFixed(0)}%` : `${change.toFixed(0)}%`;
    };

    const calculateDifference = (current, previous) => {
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
    console.error("Error fetching dashboard data:", error);
    throw error;
  }
};