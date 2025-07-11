export const getDashboardData = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    // Fetch aggregated statistics from multiple tables
    const [clientsResponse, projectsResponse, tasksResponse, invoicesResponse] = await Promise.all([
      // Total clients count
      apperClient.fetchRecords('client', {
        aggregators: [{
          id: 'totalClients',
          fields: [{ field: { Name: 'Id' }, Function: 'Count' }]
        }]
      }),
      // Active projects count
      apperClient.fetchRecords('project', {
        aggregators: [{
          id: 'activeProjects',
          fields: [{ field: { Name: 'Id' }, Function: 'Count' }],
          where: [{ FieldName: 'status', Operator: 'EqualTo', Values: ['active'] }]
        }]
      }),
      // Tasks statistics (pending and completed)
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
      // Invoice statistics (total revenue and overdue invoices)
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
      })
    ]);

    // Extract aggregated values with fallbacks
    const totalClients = clientsResponse?.aggregators?.find(a => a.id === 'totalClients')?.value || 0;
    const activeProjects = projectsResponse?.aggregators?.find(a => a.id === 'activeProjects')?.value || 0;
    const pendingTasks = tasksResponse?.aggregators?.find(a => a.id === 'pendingTasks')?.value || 0;
    const completedTasks = tasksResponse?.aggregators?.find(a => a.id === 'completedTasks')?.value || 0;
    const overdueTasks = tasksResponse?.aggregators?.find(a => a.id === 'overdueTasks')?.value || 0;
    const monthlyRevenue = invoicesResponse?.aggregators?.find(a => a.id === 'monthlyRevenue')?.value || 0;
    const overdueInvoices = invoicesResponse?.aggregators?.find(a => a.id === 'overdueInvoices')?.value || 0;

    return {
      summary: {
        totalClients,
        activeProjects,
        pendingTasks,
        monthlyRevenue,
        completedTasks,
        overdueItems: overdueTasks + overdueInvoices
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