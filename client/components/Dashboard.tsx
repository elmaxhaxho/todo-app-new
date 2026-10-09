'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Dashboard({ isAdmin }: any) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('token');

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL ||
        'http://localhost:5000';

      const res = await fetch(
        `${apiUrl}/api/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await res.json();

      if (!res.ok) {
        if (result.message === 'Invalid or expired session' || res.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user_session');
          router.push('/login');
          return;
        }
        throw new Error(
          result.message ||
          'Failed to fetch dashboard data'
        );
      }

      console.log('DASHBOARD DATA:', result);

      setData(result);

    } catch (err: any) {
      console.error(err);
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchDashboard();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  if (error) {
    return (
      <section className="page-section">
        <div className="content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your work.</p>
          </div>
        </div>

        <p style={{ color: '#d85c5c' }}>
          {error}
        </p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="page-section">
        <div className="content-header">
          <div>
            <h1>Dashboard</h1>
            <p>Overview of your work.</p>
          </div>
        </div>

        <p style={{ color: '#858595' }}>
          Loading dashboard...
        </p>
      </section>
    );
  }

  const adminCards = [
    ['Total Projects', data.totalProjects ?? 0],
    ['Total Tasks', data.totalTasks ?? 0],
    ['Total Clients', data.totalClients ?? 0],
    ['Total Users', data.totalUsers ?? 0],
    ['Archived Projects', data.archivedProjects ?? 0],
    ['Archived Tasks', data.archivedTasks ?? 0],
  ];

  const employeeCards = [
    ['My Projects', data.myProjects ?? 0],
    ['My Tasks', data.myTasks ?? 0],
    ['My Pending Tasks', data.myPendingTasks ?? 0],
    ['My Completed Tasks', data.myCompletedTasks ?? 0],
  ];

  const cards = isAdmin
    ? adminCards
    : employeeCards;

  return (
    <section className="page-section">

      <div className="content-header">

        <div>
          <h1>Dashboard</h1>

          <p>
            Overview of your work.
          </p>
        </div>

      </div>

      <div className="dashboard-cards">

        {cards.map(([title, value], index) => (

          <div
            className="dashboard-card"
            key={index}
          >

            <h3>
              {title}
            </h3>

            <strong>
              {value}
            </strong>

          </div>

        ))}

      </div>

    </section>
  );
}