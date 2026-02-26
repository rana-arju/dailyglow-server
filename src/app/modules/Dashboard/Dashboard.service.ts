import prisma from '../../lib/prisma';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const getDateRange = (period: string): DateRange => {
  const now = new Date();
  const endDate = new Date(now);
  const startDate = new Date(now);

  switch (period) {
    case 'today':
      // Start of today (00:00:00)
      startDate.setHours(0, 0, 0, 0);
      // End of today (23:59:59)
      endDate.setHours(23, 59, 59, 999);
      break;
    case '7days':
      startDate.setDate(startDate.getDate() - 6); // Include today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '30days':
      startDate.setDate(startDate.getDate() - 29); // Include today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '60days':
      startDate.setDate(startDate.getDate() - 59); // Include today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    case '90days':
      startDate.setDate(startDate.getDate() - 89); // Include today
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    default:
      startDate.setDate(startDate.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
  }

  return { startDate, endDate };
};

const getDashboardStats = async (period: string = '30days') => {
  const { startDate, endDate } = getDateRange(period);

  // Get total active subscribers
  const totalActiveSubscribers = await prisma.contact.count({
    where: { status: 'SUBSCRIBED' },
  });

  // Get new subscribers in period
  const newSubscribers = await prisma.contact.count({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
  });

  // Get new subscribers today
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const newSubscribersToday = await prisma.contact.count({
    where: {
      createdAt: { gte: todayStart },
    },
  });

  // Get new subscribers this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);
  const newSubscribersThisMonth = await prisma.contact.count({
    where: {
      createdAt: { gte: monthStart },
    },
  });

  // Get unsubscribed count
  const unsubscribedCount = await prisma.contact.count({
    where: {
      status: 'UNSUBSCRIBED',
      updatedAt: { gte: startDate, lte: endDate },
    },
  });

  // Get bounced count
  const bouncedCount = await prisma.contact.count({
    where: { status: 'BOUNCED' },
  });

  // Get complained count
  const complainedCount = await prisma.contact.count({
    where: { status: 'COMPLAINED' },
  });

  return {
    totalActiveSubscribers,
    newSubscribers,
    newSubscribersToday,
    newSubscribersThisMonth,
    unsubscribedCount,
    bouncedCount,
    complainedCount,
    period,
  };
};

const getSubscribersTrend = async (period: string = '30days') => {
  const { startDate, endDate } = getDateRange(period);

  // Get all contacts created in the period
  const contacts = await prisma.contact.findMany({
    where: {
      createdAt: { gte: startDate, lte: endDate },
    },
    select: {
      createdAt: true,
      status: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date or hour depending on period
  const dateMap = new Map<string, { subscribers: number; unsubscribed: number; dateObj: Date }>();

  if (period === 'today') {
    // For today, initialize hourly buckets (0-23)
    const currentHour = new Date(startDate);
    for (let hour = 0; hour < 24; hour++) {
      currentHour.setHours(hour, 0, 0, 0);
      const dateKey = `${currentHour.getFullYear()}-${String(currentHour.getMonth() + 1).padStart(2, '0')}-${String(currentHour.getDate()).padStart(2, '0')}-${String(hour).padStart(2, '0')}`;
      dateMap.set(dateKey, {
        subscribers: 0,
        unsubscribed: 0,
        dateObj: new Date(currentHour),
      });
    }

    // Count contacts per hour
    contacts.forEach((contact) => {
      const contactDate = new Date(contact.createdAt);
      const year = contactDate.getFullYear();
      const month = String(contactDate.getMonth() + 1).padStart(2, '0');
      const day = String(contactDate.getDate()).padStart(2, '0');
      const hour = String(contactDate.getHours()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}-${hour}`;

      const data = dateMap.get(dateKey);
      if (data) {
        data.subscribers += 1;
      }
    });
  } else {
    // For other periods, initialize daily buckets
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      dateMap.set(dateKey, {
        subscribers: 0,
        unsubscribed: 0,
        dateObj: new Date(currentDate),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Count contacts per day
    contacts.forEach((contact) => {
      const contactDate = new Date(contact.createdAt);
      const year = contactDate.getFullYear();
      const month = String(contactDate.getMonth() + 1).padStart(2, '0');
      const day = String(contactDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      const data = dateMap.get(dateKey);
      if (data) {
        data.subscribers += 1;
      }
    });
  }

  // Get unsubscribed per day/hour
  const unsubscribed = await prisma.contact.findMany({
    where: {
      status: 'UNSUBSCRIBED',
      updatedAt: { gte: startDate, lte: endDate },
    },
    select: {
      updatedAt: true,
    },
  });

  unsubscribed.forEach((contact) => {
    const contactDate = new Date(contact.updatedAt);
    const year = contactDate.getFullYear();
    const month = String(contactDate.getMonth() + 1).padStart(2, '0');
    const day = String(contactDate.getDate()).padStart(2, '0');

    let dateKey: string;
    if (period === 'today') {
      const hour = String(contactDate.getHours()).padStart(2, '0');
      dateKey = `${year}-${month}-${day}-${hour}`;
    } else {
      dateKey = `${year}-${month}-${day}`;
    }

    const data = dateMap.get(dateKey);
    if (data) {
      data.unsubscribed += 1;
    }
  });

  // Convert to array and format dates based on period
  const trend = Array.from(dateMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => {
      let formattedDate = date;
      const d = data.dateObj;

      // Format date based on period for better readability
      if (period === 'today') {
        // For today, show "Feb 21, 00:00" format
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        const hour = String(d.getHours()).padStart(2, '0');
        formattedDate = `${monthName} ${day}, ${hour}:00`;
      } else if (period === '7days') {
        // For 7 days, show "Feb 21" format
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        // For 30/60/90 days, show "2/21" format
        formattedDate = `${d.getMonth() + 1}/${d.getDate()}`;
      }

      return {
        date: formattedDate,
        subscribers: data.subscribers,
        unsubscribed: data.unsubscribed,
      };
    });

  return trend;
};

const getFolderStats = async () => {
  const folders = await prisma.contactFolder.findMany({
    include: {
      _count: {
        select: { contacts: true },
      },
    },
    orderBy: {
      contacts: {
        _count: 'desc',
      },
    },
    take: 10,
  });

  return folders.map((folder) => ({
    id: folder.id,
    name: folder.name,
    contactCount: folder._count.contacts,
  }));
};

const getStatusDistribution = async () => {
  const statuses = await prisma.contact.groupBy({
    by: ['status'],
    _count: {
      status: true,
    },
  });

  return statuses.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));
};

const getCampaignStats = async (period: string = '30days') => {
  const { startDate, endDate } = getDateRange(period);

  // Get campaigns sent in the period
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'SENT',
      sentAt: { gte: startDate, lte: endDate },
    },
    select: {
      sentCount: true,
      openCount: true,
      clickCount: true,
      unsubscribeCount: true,
    },
  });

  const totalEmailsSent = campaigns.reduce((sum, c) => sum + c.sentCount, 0);
  const totalOpens = campaigns.reduce((sum, c) => sum + c.openCount, 0);
  const totalClicks = campaigns.reduce((sum, c) => sum + c.clickCount, 0);
  const totalUnsubscribes = campaigns.reduce((sum, c) => sum + c.unsubscribeCount, 0);

  const openRate = totalEmailsSent > 0 ? ((totalOpens / totalEmailsSent) * 100).toFixed(1) : '0.0';
  const clickRate = totalEmailsSent > 0 ? ((totalClicks / totalEmailsSent) * 100).toFixed(1) : '0.0';
  const ctor = totalOpens > 0 ? ((totalClicks / totalOpens) * 100).toFixed(1) : '0.0';

  return {
    emailsSent: totalEmailsSent,
    opens: totalOpens,
    clicks: totalClicks,
    unsubscribes: totalUnsubscribes,
    openRate,
    clickRate,
    ctor,
    period,
  };
};

const getCampaignTrend = async (period: string = '30days') => {
  const { startDate, endDate } = getDateRange(period);

  // Get all campaigns sent in the period
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'SENT',
      sentAt: { gte: startDate, lte: endDate },
    },
    select: {
      sentAt: true,
      sentCount: true,
      openCount: true,
    },
    orderBy: { sentAt: 'asc' },
  });

  // Group by date
  const dateMap = new Map<string, { emailsSent: number; opens: number; dateObj: Date }>();

  if (period === 'today') {
    // For today, initialize hourly buckets
    const currentHour = new Date(startDate);
    for (let hour = 0; hour < 24; hour++) {
      currentHour.setHours(hour, 0, 0, 0);
      const dateKey = `${currentHour.getFullYear()}-${String(currentHour.getMonth() + 1).padStart(2, '0')}-${String(currentHour.getDate()).padStart(2, '0')}-${String(hour).padStart(2, '0')}`;
      dateMap.set(dateKey, {
        emailsSent: 0,
        opens: 0,
        dateObj: new Date(currentHour),
      });
    }
  } else {
    // For other periods, initialize daily buckets
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, '0');
      const day = String(currentDate.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;

      dateMap.set(dateKey, {
        emailsSent: 0,
        opens: 0,
        dateObj: new Date(currentDate),
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  // Aggregate campaign data
  campaigns.forEach((campaign) => {
    if (!campaign.sentAt) return;

    const campaignDate = new Date(campaign.sentAt);
    const year = campaignDate.getFullYear();
    const month = String(campaignDate.getMonth() + 1).padStart(2, '0');
    const day = String(campaignDate.getDate()).padStart(2, '0');

    let dateKey: string;
    if (period === 'today') {
      const hour = String(campaignDate.getHours()).padStart(2, '0');
      dateKey = `${year}-${month}-${day}-${hour}`;
    } else {
      dateKey = `${year}-${month}-${day}`;
    }

    const data = dateMap.get(dateKey);
    if (data) {
      data.emailsSent += campaign.sentCount;
      data.opens += campaign.openCount;
    }
  });

  // Convert to array and format dates
  const trend = Array.from(dateMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, data]) => {
      let formattedDate = date;
      const d = data.dateObj;

      if (period === 'today') {
        const monthName = d.toLocaleDateString('en-US', { month: 'short' });
        const day = d.getDate();
        const hour = String(d.getHours()).padStart(2, '0');
        formattedDate = `${monthName} ${day}, ${hour}:00`;
      } else if (period === '7days') {
        formattedDate = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        formattedDate = `${d.getMonth() + 1}/${d.getDate()}`;
      }

      return {
        date: formattedDate,
        emailsSent: data.emailsSent,
        opens: data.opens,
      };
    });

  return trend;
};

const getCampaignPerformanceByMonth = async () => {
  // Get all sent campaigns
  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'SENT',
      sentAt: { not: null },
    },
    select: {
      id: true,
      name: true,
      sentAt: true,
      sentCount: true,
      openCount: true,
      clickCount: true,
      unsubscribeCount: true,
      recipients: {
        where: { complained: true },
        select: { id: true },
      },
    },
    orderBy: { sentAt: 'desc' },
    take: 20,
  });

  return campaigns.map((campaign) => {
    const openRate = campaign.sentCount > 0 ? ((campaign.openCount / campaign.sentCount) * 100).toFixed(1) : '0.0';
    const clickRate = campaign.sentCount > 0 ? ((campaign.clickCount / campaign.sentCount) * 100).toFixed(1) : '0.0';
    const unsubscribeRate = campaign.sentCount > 0 ? ((campaign.unsubscribeCount / campaign.sentCount) * 100).toFixed(1) : '0.0';
    const spamComplaintCount = campaign.recipients.length;
    const spamComplaintRate = campaign.sentCount > 0 ? ((spamComplaintCount / campaign.sentCount) * 100).toFixed(1) : '0.0';

    return {
      id: campaign.id,
      monthSent: campaign.sentAt ? new Date(campaign.sentAt).toISOString().split('T')[0] : '',
      campaignName: campaign.name,
      emailsSent: campaign.sentCount,
      opened: campaign.openCount,
      openRate,
      clicked: campaign.clickCount,
      clickRate,
      unsubscribed: campaign.unsubscribeCount,
      unsubscribeRate,
      spamComplaints: spamComplaintCount,
      spamComplaintRate,
    };
  });
};

export const DashboardService = {
  getDashboardStats,
  getSubscribersTrend,
  getFolderStats,
  getStatusDistribution,
  getCampaignStats,
  getCampaignTrend,
  getCampaignPerformanceByMonth,
};
