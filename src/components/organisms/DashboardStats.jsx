import React from "react";
import StatCard from "@/components/molecules/StatCard";

const DashboardStats = ({ dashboardData }) => {
  // Default data structure in case props are not provided
  const defaultStats = {
    totalClients: 0,
    activeProjects: 0,
    pendingTasks: 0,
    monthlyRevenue: 0,
    completedTasks: 0,
    overdueItems: 0
  };

  const summary = dashboardData?.summary || defaultStats;

const stats = [
    {
      title: "Total Clients",
      value: summary.totalClients.toString(),
      change: summary.clientGrowth || "0%",
      changeType: summary.clientGrowthType || "neutral",
      icon: "Users",
      delay: 0
    },
    {
      title: "Active Projects",
      value: summary.activeProjects.toString(),
      change: summary.projectChange || "No change",
      changeType: summary.projectChangeType || "neutral",
      icon: "FolderOpen",
      delay: 0.1
    },
    {
      title: "Pending Tasks",
      value: summary.pendingTasks.toString(),
      change: summary.taskChange || "No change",
      changeType: summary.taskChangeType || "neutral",
      icon: "CheckSquare",
      delay: 0.2
    },
    {
      title: "Monthly Revenue",
      value: `$${summary.monthlyRevenue.toLocaleString()}`,
      change: summary.revenueGrowth || "0%",
      changeType: summary.revenueGrowthType || "neutral",
      icon: "DollarSign",
      delay: 0.3
    },
    {
      title: "Completed Tasks",
      value: summary.completedTasks.toString(),
      change: summary.completedTasksChange || "No change",
      changeType: summary.completedTasksChangeType || "neutral",
      icon: "CheckCircle2",
      delay: 0.4
    },
    {
      title: "Overdue Items",
      value: summary.overdueItems.toString(),
      change: summary.overdueUrgency || "None",
      changeType: summary.overdueUrgencyType || "neutral",
      icon: "AlertTriangle",
      delay: 0.5
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {stats.map((stat, index) => (
        <StatCard
          key={index}
          title={stat.title}
          value={stat.value}
          change={stat.change}
          changeType={stat.changeType}
          icon={stat.icon}
          gradient={index % 2 === 0}
          delay={stat.delay}
        />
      ))}
    </div>
  );
};

export default DashboardStats;