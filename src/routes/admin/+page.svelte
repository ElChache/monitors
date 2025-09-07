<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  // Admin data state
  let adminData = {
    totalUsers: 0,
    activeMonitors: 0,
    totalAlerts: 0,
    systemHealth: 'good' as 'good' | 'warning' | 'critical',
    lastUpdated: new Date().toISOString()
  };

  // Users management
  let users = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user',
      status: 'active',
      joinedDate: '2024-12-01T00:00:00Z',
      lastLogin: '2025-01-07T06:00:00Z',
      monitorsCount: 3
    },
    {
      id: '2', 
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'admin',
      status: 'active',
      joinedDate: '2024-11-15T00:00:00Z',
      lastLogin: '2025-01-06T18:30:00Z',
      monitorsCount: 8
    },
    {
      id: '3',
      name: 'Bob Johnson',
      email: 'bob@example.com',
      role: 'user',
      status: 'inactive',
      joinedDate: '2024-12-20T00:00:00Z',
      lastLogin: '2024-12-25T10:00:00Z',
      monitorsCount: 1
    }
  ];

  // System statistics
  let systemStats = {
    database: { status: 'healthy', responseTime: '12ms' },
    redis: { status: 'healthy', responseTime: '3ms' },
    emailService: { status: 'healthy', lastSent: '2 minutes ago' },
    monitoring: { status: 'healthy', activeJobs: 42 }
  };

  // Loading states
  let loading = {
    dashboard: true,
    users: false,
    systemHealth: false
  };

  // Active navigation tab
  let activeTab = 'dashboard';

  // Filters and pagination
  let userFilter = {
    status: 'all',
    role: 'all',
    search: ''
  };

  let pagination = {
    currentPage: 1,
    itemsPerPage: 10,
    totalItems: 0
  };

  onMount(() => {
    if (browser) {
      loadDashboardData();
    }
  });

  const loadDashboardData = async () => {
    loading.dashboard = true;
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      adminData = {
        totalUsers: users.length,
        activeMonitors: users.reduce((sum, user) => sum + user.monitorsCount, 0),
        totalAlerts: 127,
        systemHealth: 'good',
        lastUpdated: new Date().toISOString()
      };
      
      pagination.totalItems = users.length;
      
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      loading.dashboard = false;
    }
  };

  const updateUserStatus = async (userId: string, newStatus: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      users = users.map(user => 
        user.id === userId 
          ? { ...user, status: newStatus as 'active' | 'inactive' }
          : user
      );
      
    } catch (error) {
      console.error('Failed to update user status:', error);
    }
  };

  const updateUserRole = async (userId: string, newRole: string) => {
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      users = users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole as 'user' | 'admin' }
          : user
      );
      
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      users = users.filter(user => user.id !== userId);
      adminData.totalUsers = users.length;
      
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const refreshSystemHealth = async () => {
    loading.systemHealth = true;
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Simulate some status changes
      const statuses = ['healthy', 'warning', 'error'];
      systemStats = {
        database: { 
          status: statuses[Math.floor(Math.random() * statuses.length)], 
          responseTime: `${Math.floor(Math.random() * 50) + 5}ms` 
        },
        redis: { 
          status: statuses[Math.floor(Math.random() * statuses.length)], 
          responseTime: `${Math.floor(Math.random() * 10) + 1}ms` 
        },
        emailService: { 
          status: statuses[Math.floor(Math.random() * statuses.length)], 
          lastSent: `${Math.floor(Math.random() * 10) + 1} minutes ago` 
        },
        monitoring: { 
          status: statuses[Math.floor(Math.random() * statuses.length)], 
          activeJobs: Math.floor(Math.random() * 100) + 20 
        }
      };
      
    } catch (error) {
      console.error('Failed to refresh system health:', error);
    } finally {
      loading.systemHealth = false;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'inactive':
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  // Filtered users based on current filters
  $: filteredUsers = users.filter(user => {
    if (userFilter.status !== 'all' && user.status !== userFilter.status) return false;
    if (userFilter.role !== 'all' && user.role !== userFilter.role) return false;
    if (userFilter.search && !user.name.toLowerCase().includes(userFilter.search.toLowerCase()) && 
        !user.email.toLowerCase().includes(userFilter.search.toLowerCase())) return false;
    return true;
  });

  // Paginated users
  $: paginatedUsers = filteredUsers.slice(
    (pagination.currentPage - 1) * pagination.itemsPerPage,
    pagination.currentPage * pagination.itemsPerPage
  );

  $: totalPages = Math.ceil(filteredUsers.length / pagination.itemsPerPage);
</script>

<svelte:head>
  <title>Admin Panel | Monitors!</title>
  <meta name="description" content="Administrative interface for user and system management." />
</svelte:head>

<div class="min-h-screen bg-gray-50">
  <!-- Admin Header -->
  <header class="bg-white shadow-sm border-b border-gray-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-900">Admin Panel</h1>
          <span class="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-medium">
            Restricted Access
          </span>
        </div>
        <div class="flex items-center space-x-4">
          <span class="text-sm text-gray-500">
            Last updated: {formatDateTime(adminData.lastUpdated)}
          </span>
          <a href="/" class="btn-outline">
            ← Back to App
          </a>
        </div>
      </div>
    </div>
  </header>

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
    <!-- Navigation Tabs -->
    <nav class="flex space-x-8 mb-6">
      <button
        onclick={() => activeTab = 'dashboard'}
        class="pb-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'dashboard' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        📊 Dashboard
      </button>
      <button
        onclick={() => activeTab = 'users'}
        class="pb-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'users' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        👥 User Management
      </button>
      <button
        onclick={() => activeTab = 'system'}
        class="pb-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'system' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        ⚙️ System Health
      </button>
      <button
        onclick={() => activeTab = 'settings'}
        class="pb-2 border-b-2 font-medium text-sm transition-colors {activeTab === 'settings' 
          ? 'border-blue-500 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}"
      >
        🔧 Settings
      </button>
    </nav>

    <!-- Dashboard Tab -->
    {#if activeTab === 'dashboard'}
      <div class="space-y-6">
        {#if loading.dashboard}
          <div class="text-center py-8">
            <svg class="animate-spin w-8 h-8 text-blue-600 mx-auto mb-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="text-gray-600">Loading dashboard data...</p>
          </div>
        {:else}
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span class="text-blue-600 font-semibold">👥</span>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-semibold text-gray-900">{adminData.totalUsers}</p>
                  <p class="text-gray-600 text-sm">Total Users</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <span class="text-green-600 font-semibold">📊</span>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-semibold text-gray-900">{adminData.activeMonitors}</p>
                  <p class="text-gray-600 text-sm">Active Monitors</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                    <span class="text-yellow-600 font-semibold">🔔</span>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-semibold text-gray-900">{adminData.totalAlerts}</p>
                  <p class="text-gray-600 text-sm">Total Alerts</p>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div class="flex items-center">
                <div class="flex-shrink-0">
                  <div class="w-8 h-8 {getStatusColor(adminData.systemHealth)} rounded-full flex items-center justify-center">
                    <span class="font-semibold">⚡</span>
                  </div>
                </div>
                <div class="ml-4">
                  <p class="text-2xl font-semibold text-gray-900 capitalize">{adminData.systemHealth}</p>
                  <p class="text-gray-600 text-sm">System Health</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent Activity -->
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 class="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
            <div class="space-y-3">
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-green-600">✓</span>
                <span class="text-sm text-gray-600">New user registered: john@example.com</span>
                <span class="text-xs text-gray-400 ml-auto">2 minutes ago</span>
              </div>
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-blue-600">📊</span>
                <span class="text-sm text-gray-600">Monitor created: "Bitcoin Price Alert"</span>
                <span class="text-xs text-gray-400 ml-auto">5 minutes ago</span>
              </div>
              <div class="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span class="text-orange-600">⚠️</span>
                <span class="text-sm text-gray-600">High alert volume detected</span>
                <span class="text-xs text-gray-400 ml-auto">12 minutes ago</span>
              </div>
            </div>
          </div>
        {/if}
      </div>

    <!-- User Management Tab -->
    {:else if activeTab === 'users'}
      <div class="space-y-6">
        <!-- User Filters -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                id="search"
                type="text"
                bind:value={userFilter.search}
                placeholder="Search users..."
                class="form-input"
              />
            </div>
            <div>
              <label for="status-filter" class="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select id="status-filter" bind:value={userFilter.status} class="form-input">
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label for="role-filter" class="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select id="role-filter" bind:value={userFilter.role} class="form-input">
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="flex items-end">
              <button onclick={() => loadDashboardData()} class="btn-outline w-full">
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>

        <!-- Users Table -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="px-6 py-4 border-b border-gray-200">
            <h3 class="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length} of {users.length})
            </h3>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monitors</th>
                  <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Login</th>
                  <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="bg-white divide-y divide-gray-200">
                {#each paginatedUsers as user}
                  <tr class="hover:bg-gray-50">
                    <td class="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div class="text-sm font-medium text-gray-900">{user.name}</div>
                        <div class="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.role}
                        onchange={(e) => updateUserRole(user.id, e.target.value)}
                        class="text-sm border rounded px-2 py-1"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                      <select
                        value={user.status}
                        onchange={(e) => updateUserStatus(user.id, e.target.value)}
                        class="text-sm border rounded px-2 py-1"
                      >
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {user.monitorsCount}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(user.lastLogin)}
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onclick={() => deleteUser(user.id)}
                        class="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
          
          {#if totalPages > 1}
            <!-- Pagination -->
            <div class="px-6 py-3 border-t border-gray-200 flex items-center justify-between">
              <div class="text-sm text-gray-700">
                Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to 
                {Math.min(pagination.currentPage * pagination.itemsPerPage, filteredUsers.length)} of {filteredUsers.length} results
              </div>
              <div class="flex space-x-2">
                <button
                  onclick={() => pagination.currentPage = Math.max(1, pagination.currentPage - 1)}
                  disabled={pagination.currentPage === 1}
                  class="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span class="px-3 py-1 text-sm">
                  Page {pagination.currentPage} of {totalPages}
                </span>
                <button
                  onclick={() => pagination.currentPage = Math.min(totalPages, pagination.currentPage + 1)}
                  disabled={pagination.currentPage === totalPages}
                  class="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          {/if}
        </div>
      </div>

    <!-- System Health Tab -->
    {:else if activeTab === 'system'}
      <div class="space-y-6">
        <div class="flex justify-between items-center">
          <h3 class="text-lg font-medium text-gray-900">System Health Status</h3>
          <button
            onclick={refreshSystemHealth}
            disabled={loading.systemHealth}
            class="btn-primary {loading.systemHealth ? 'opacity-50 cursor-not-allowed' : ''}"
          >
            {#if loading.systemHealth}
              <svg class="animate-spin w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 714 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Checking...
            {:else}
              🔄 Refresh Status
            {/if}
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium text-gray-900">Database</h4>
              <span class="px-2 py-1 text-xs rounded-full border {getStatusColor(systemStats.database.status)}">
                {systemStats.database.status}
              </span>
            </div>
            <p class="text-sm text-gray-600">Response Time: {systemStats.database.responseTime}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium text-gray-900">Redis Cache</h4>
              <span class="px-2 py-1 text-xs rounded-full border {getStatusColor(systemStats.redis.status)}">
                {systemStats.redis.status}
              </span>
            </div>
            <p class="text-sm text-gray-600">Response Time: {systemStats.redis.responseTime}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium text-gray-900">Email Service</h4>
              <span class="px-2 py-1 text-xs rounded-full border {getStatusColor(systemStats.emailService.status)}">
                {systemStats.emailService.status}
              </span>
            </div>
            <p class="text-sm text-gray-600">Last Sent: {systemStats.emailService.lastSent}</p>
          </div>

          <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div class="flex items-center justify-between mb-4">
              <h4 class="text-md font-medium text-gray-900">Monitoring Jobs</h4>
              <span class="px-2 py-1 text-xs rounded-full border {getStatusColor(systemStats.monitoring.status)}">
                {systemStats.monitoring.status}
              </span>
            </div>
            <p class="text-sm text-gray-600">Active Jobs: {systemStats.monitoring.activeJobs}</p>
          </div>
        </div>
      </div>

    <!-- Settings Tab -->
    {:else if activeTab === 'settings'}
      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
          <div class="space-y-4">
            <div>
              <label for="monitor-limit" class="block text-sm font-medium text-gray-700 mb-2">
                Default User Monitor Limit
              </label>
              <input id="monitor-limit" type="number" value="10" class="form-input w-32" />
              <p class="text-sm text-gray-500 mt-1">Maximum monitors per user account</p>
            </div>
            
            <div>
              <label for="alert-rate-limit" class="block text-sm font-medium text-gray-700 mb-2">
                Alert Rate Limit (per hour)
              </label>
              <input id="alert-rate-limit" type="number" value="50" class="form-input w-32" />
              <p class="text-sm text-gray-500 mt-1">Maximum alerts that can be sent per user per hour</p>
            </div>
            
            <div>
              <label class="flex items-center space-x-2">
                <input type="checkbox" checked class="rounded" />
                <span class="text-sm font-medium text-gray-700">Enable new user registration</span>
              </label>
            </div>
            
            <div>
              <label class="flex items-center space-x-2">
                <input type="checkbox" class="rounded" />
                <span class="text-sm font-medium text-gray-700">Maintenance mode</span>
              </label>
              <p class="text-sm text-gray-500 ml-6">Prevent non-admin access to the application</p>
            </div>
          </div>
          
          <div class="mt-6">
            <button class="btn-primary">Save Settings</button>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>