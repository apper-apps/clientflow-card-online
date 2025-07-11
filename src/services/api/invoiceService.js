export const getAllInvoices = async () => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "clientId" } },
        { field: { Name: "projectId" } },
        { field: { Name: "amount" } },
        { field: { Name: "status" } },
        { field: { Name: "dueDate" } },
        { field: { Name: "paymentDate" } }
      ],
      orderBy: [
        { fieldName: "dueDate", sorttype: "DESC" }
      ]
    };
    
    const response = await apperClient.fetchRecords('app_invoice', params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data || [];
  } catch (error) {
    console.error("Error fetching invoices:", error);
    throw error;
  }
};

export const getInvoiceById = async (id) => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      fields: [
        { field: { Name: "Name" } },
        { field: { Name: "clientId" } },
        { field: { Name: "projectId" } },
        { field: { Name: "amount" } },
        { field: { Name: "status" } },
        { field: { Name: "dueDate" } },
        { field: { Name: "paymentDate" } }
      ]
    };
    
    const response = await apperClient.getRecordById('app_invoice', parseInt(id), params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching invoice with ID ${id}:`, error);
    throw error;
  }
};

export const createInvoice = async (invoiceData) => {
  try {
    // Validate required fields
    if (!invoiceData.projectId) {
      throw new Error("Project ID is required");
    }
    if (!invoiceData.amount || invoiceData.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }
    if (!invoiceData.dueDate) {
      throw new Error("Due date is required");
    }

    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      records: [{
        Name: `Invoice-${Date.now()}`,
        clientId: parseInt(invoiceData.clientId),
        projectId: parseInt(invoiceData.projectId),
        amount: parseFloat(invoiceData.amount),
        status: invoiceData.status || 'draft',
        dueDate: invoiceData.dueDate,
        paymentDate: invoiceData.paymentDate || null
      }]
    };
    
    const response = await apperClient.createRecord('app_invoice', params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to create ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || 'Failed to create invoice');
      }
      
      return response.results[0].data;
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
};

export const updateInvoice = async (id, invoiceData) => {
  try {
    if (invoiceData.amount !== undefined && invoiceData.amount <= 0) {
      throw new Error("Amount must be greater than 0");
    }

    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      records: [{
        Id: parseInt(id),
        clientId: invoiceData.clientId ? parseInt(invoiceData.clientId) : undefined,
        projectId: invoiceData.projectId ? parseInt(invoiceData.projectId) : undefined,
        amount: invoiceData.amount ? parseFloat(invoiceData.amount) : undefined,
        status: invoiceData.status,
        dueDate: invoiceData.dueDate,
        paymentDate: invoiceData.paymentDate
      }]
    };
    
    const response = await apperClient.updateRecord('app_invoice', params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to update ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || 'Failed to update invoice');
      }
      
      return response.results[0].data;
    }
  } catch (error) {
    console.error("Error updating invoice:", error);
    throw error;
  }
};

export const markInvoiceAsSent = async (id) => {
  return updateInvoice(id, { status: 'sent' });
};

export const markInvoiceAsPaid = async (id, paymentDate) => {
  if (!paymentDate) {
    throw new Error("Payment date is required");
  }
  
  return updateInvoice(id, { 
    status: 'paid', 
    paymentDate: new Date(paymentDate).toISOString() 
  });
};

export const deleteInvoice = async (id) => {
  try {
    const { ApperClient } = window.ApperSDK;
    const apperClient = new ApperClient({
      apperProjectId: import.meta.env.VITE_APPER_PROJECT_ID,
      apperPublicKey: import.meta.env.VITE_APPER_PUBLIC_KEY
    });
    
    const params = {
      RecordIds: [parseInt(id)]
    };
    
    const response = await apperClient.deleteRecord('app_invoice', params);
    
    if (!response.success) {
      throw new Error(response.message);
    }
    
    if (response.results) {
      const failedRecords = response.results.filter(result => !result.success);
      if (failedRecords.length > 0) {
        console.error(`Failed to delete ${failedRecords.length} records:${JSON.stringify(failedRecords)}`);
        throw new Error(failedRecords[0].message || 'Failed to delete invoice');
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error deleting invoice:", error);
    throw error;
  }
};