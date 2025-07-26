import React, { useEffect, useRef, useState } from 'react';
import { useUser } from '../contexts/UserContext';
import DashboardScript from '../components/DashboardScript';
import Calendar from '../components/Calendar';

const DashboardPage: React.FC = () => {
  const { user } = useUser();
  const chartRef1 = useRef<HTMLCanvasElement>(null);
  const chartRef2 = useRef<HTMLCanvasElement>(null);
  const chartRef3 = useRef<HTMLCanvasElement>(null);
  const [activeSection, setActiveSection] = useState('dashboard');

  useEffect(() => {
    const loadCharts = async () => {
      try {
        const { Chart } = await import('chart.js/auto');
        
        // Simple Bar Chart
        if (chartRef1.current) {
          new Chart(chartRef1.current, {
            type: 'bar',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Progress',
                data: [65, 59, 80, 81, 56, 55],
                backgroundColor: '#0d6efd',
                borderColor: '#0d6efd',
                borderWidth: 1
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#3b3d56'
                  },
                  ticks: {
                    color: '#71748c'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    color: '#71748c'
                  }
                }
              }
            }
          });
        }

        // Simple Line Chart
        if (chartRef2.current) {
          new Chart(chartRef2.current, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Performance',
                data: [12, 19, 3, 5, 2, 3],
                borderColor: '#dc3545',
                backgroundColor: 'transparent',
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#3b3d56'
                  },
                  ticks: {
                    color: '#71748c'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    color: '#71748c'
                  }
                }
              }
            }
          });
        }

        // Simple Area Chart
        if (chartRef3.current) {
          new Chart(chartRef3.current, {
            type: 'line',
            data: {
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                label: 'Growth',
                data: [30, 45, 35, 50, 40, 60],
                borderColor: '#198754',
                backgroundColor: 'rgba(25, 135, 84, 0.1)',
                fill: true,
                tension: 0.4
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: '#3b3d56'
                  },
                  ticks: {
                    color: '#71748c'
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    color: '#71748c'
                  }
                }
              }
            }
          });
        }
      } catch (error) {
        console.error('Error loading charts:', error);
      }
    };

    // Load charts after a short delay
    const timer = setTimeout(loadCharts, 500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="dashboard-container">
      <DashboardScript />
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&display=swap');
        
        :root {
          --dk-gray-100: #F3F4F6;
          --dk-gray-200: #E5E7EB;
          --dk-gray-300: #D1D5DB;
          --dk-gray-400: #9CA3AF;
          --dk-gray-500: #6B7280;
          --dk-gray-600: #4B5563;
          --dk-gray-700: #374151;
          --dk-gray-800: #1F2937;
          --dk-gray-900: #111827;
          --dk-dark-bg: #313348;
          --dk-darker-bg: #2a2b3d;
          --navbar-bg-color: #6f6486;
          --sidebar-bg-color: #252636;
          --sidebar-width: 250px;
        }

        .dashboard-container {
          font-family: 'Inter', sans-serif;
          background-color: var(--dk-darker-bg);
          font-size: .925rem;
          min-height: 100vh;
          width: 100vw;
          overflow-x: hidden;
        }

        .sidebar {
          background-color: var(--sidebar-bg-color);
          width: var(--sidebar-width);
          transition: all .3s ease-in-out;
          transform: translateX(0);
          z-index: 9999999;
          position: fixed;
          top: 0;
          left: 0;
          overflow: auto;
          height: 100vh;
          float: left;
        }

        .sidebar .close-aside {
          position: absolute;
          top: 7px;
          right: 7px;
          cursor: pointer;
          color: #EEE;
        }

        .sidebar .sidebar-header {
          border-bottom: 1px solid #2a2b3c;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
        }

        .sidebar .sidebar-header h5 a {
          color: var(--dk-gray-300);
          text-decoration: none;
        }

        .sidebar .sidebar-header p {
          color: var(--dk-gray-400);
          font-size: .825rem;
        }

        .search {
          position: relative;
          text-align: center;
          padding: 1rem;
          margin-top: 0.5rem;
        }

        .search input {
          width: 100%;
          border: 0;
          background: transparent;
          color: var(--dk-gray-300);
        }

        .search i {
          position: absolute;
          right: 40px;
          top: 22px;
          color: #2b2f3a;
        }

        .categories {
          list-style: none;
          padding: 0;
        }

        .categories li {
          padding: .7rem 1.75rem;
          color: var(--dk-gray-400);
        }

        .categories li a {
          color: var(--dk-gray-400);
          text-decoration: none;
          transition: color 0.2s ease;
        }

        .categories li.active a {
          color: var(--dk-gray-200);
        }

        .categories li.active i {
          color: var(--dk-gray-300);
        }

        .categories li i {
          font-size: 18px;
          margin-right: .7rem;
          color: var(--dk-gray-500);
          transition: color 0.2s ease;
        }

        .wrapper {
          margin-left: var(--sidebar-width);
          transition: all .3s ease-in-out;
          min-height: 100vh;
          background-color: var(--dk-darker-bg);
        }

        .wrapper.fullwidth {
          margin-left: 0;
        }

        .navbar {
          background-color: var(--navbar-bg-color) !important;
          border: none !important;
          position: sticky;
          top: 0;
          z-index: 1000;
        }

        .navbar .navbar-brand {
          color: #FFF !important;
        }

        .navbar .navbar-nav > li > a {
          color: #EEE !important;
          line-height: 55px !important;
          padding: 0 10px !important;
        }

        .welcome {
          color: var(--dk-gray-300);
          margin-top: 1rem;
        }

        .welcome .content {
          background-color: var(--dk-dark-bg);
          border-radius: 0.75rem;
          padding: 1rem;
        }

        .welcome p {
          color: var(--dk-gray-400);
        }

        .statistics {
          color: var(--dk-gray-200);
          margin-top: 1.5rem;
        }

        .statistics .box {
          background-color: var(--dk-dark-bg);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .statistics .box i {
          width: 60px;
          height: 60px;
          line-height: 60px;
          border-radius: 50%;
          text-align: center;
          font-size: 1.5rem;
        }

        .statistics .box p {
          color: var(--dk-gray-400);
        }

        .charts {
          margin-top: 1.5rem;
        }

        .charts .chart-container {
          background-color: var(--dk-dark-bg);
          border-radius: 0.5rem;
          padding: 1rem;
          height: 300px;
          position: relative;
          margin-bottom: 1rem;
        }

        .charts .chart-container h3 {
          color: var(--dk-gray-400);
          margin-bottom: 1rem;
        }

        .charts .chart-container canvas {
          max-height: 250px !important;
        }

        .admins {
          margin-top: 1.5rem;
        }

        .admins .box .admin {
          background-color: var(--dk-dark-bg);
          border-radius: 0.5rem;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .admins .box h3 {
          color: var(--dk-gray-300);
        }

        .admins .box p {
          color: var(--dk-gray-400);
        }

        .statis {
          color: var(--dk-gray-100);
          margin-top: 1.5rem;
        }

        .statis .box {
          position: relative;
          overflow: hidden;
          border-radius: 3px;
          padding: 1rem;
          margin-bottom: 1rem;
        }

        .statis .box h3:after {
          content: "";
          height: 2px;
          width: 70%;
          margin: auto;
          background-color: rgba(255, 255, 255, 0.12);
          display: block;
          margin-top: 10px;
        }

        .statis .box i {
          position: absolute;
          height: 70px;
          width: 70px;
          font-size: 22px;
          padding: 15px;
          top: -25px;
          left: -25px;
          background-color: rgba(255, 255, 255, 0.15);
          line-height: 60px;
          text-align: right;
          border-radius: 50%;
        }

        .main-color {
          color: #ffc107;
        }

        @media (max-width: 767px) {
          .wrapper {
            margin-left: 0 !important;
          }
          .sidebar {
            transform: translateX(-270px);
          }
          .sidebar.show-sidebar {
            transform: translateX(0);
          }
        }

        /* Additional responsive styles */
        .row {
          display: flex;
          flex-wrap: wrap;
          margin-right: -0.75rem;
          margin-left: -0.75rem;
        }

        .col-lg-4, .col-lg-6, .col-md-6, .col-md-6.col-lg-3 {
          position: relative;
          width: 100%;
          padding-right: 0.75rem;
          padding-left: 0.75rem;
        }

        @media (min-width: 768px) {
          .col-md-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
        }

        @media (min-width: 992px) {
          .col-lg-4 {
            flex: 0 0 33.333333%;
            max-width: 33.333333%;
          }
          .col-lg-6 {
            flex: 0 0 50%;
            max-width: 50%;
          }
          .col-lg-3 {
            flex: 0 0 25%;
            max-width: 25%;
          }
        }

        .d-flex {
          display: flex !important;
        }

        .align-items-center {
          align-items: center !important;
        }

        .justify-content-center {
          justify-content: center !important;
        }

        .rounded-2 {
          border-radius: 0.375rem !important;
        }

        .rounded-3 {
          border-radius: 0.5rem !important;
        }

        .p-3 {
          padding: 1rem !important;
        }

        .p-4 {
          padding: 1.5rem !important;
        }

        .mb-0 {
          margin-bottom: 0 !important;
        }

        .mb-1 {
          margin-bottom: 0.25rem !important;
        }

        .mb-3 {
          margin-bottom: 1rem !important;
        }

        .mb-4 {
          margin-bottom: 1.5rem !important;
        }

        .mb-lg-0 {
          margin-bottom: 0 !important;
        }

        .mt-1 {
          margin-top: 0.25rem !important;
        }

        .mt-2 {
          margin-top: 0.5rem !important;
        }

        .mt-4 {
          margin-top: 1.5rem !important;
        }

        .ms-2 {
          margin-left: 0.5rem !important;
        }

        .ms-3 {
          margin-left: 1rem !important;
        }

        .fs-3 {
          font-size: 1.75rem !important;
        }

        .fs-5 {
          font-size: 1.25rem !important;
        }

        .fs-6 {
          font-size: 1rem !important;
        }

        .fs-normal {
          font-size: 1rem !important;
        }

        .text-center {
          text-align: center !important;
        }

        .text-decoration-none {
          text-decoration: none !important;
        }

        .img-fluid {
          max-width: 100%;
          height: auto;
        }

        .rounded-pill {
          border-radius: 50rem !important;
        }

        .bg-primary {
          background-color: #0d6efd !important;
        }

        .bg-danger {
          background-color: #dc3545 !important;
        }

        .bg-success {
          background-color: #198754 !important;
        }

        .bg-warning {
          background-color: #ffc107 !important;
        }

        .text-white {
          color: #fff !important;
        }

        .lead {
          font-size: 1.25rem;
          font-weight: 300;
        }
      `}</style>

      <aside className="sidebar" id="show-side-navigation1">
        <i className="uil-bars close-aside d-md-none d-lg-none" data-close="show-side-navigation1">☰</i>
        <div className="sidebar-header">
          <img
            className="rounded-pill img-fluid"
            width="65"
            src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907008/medium/1501685726/enhance"
            alt=""
          />
          <div className="ms-2">
            <h5 className="fs-6 mb-0">
              <a className="text-decoration-none" href="#">{user?.username || 'User'}</a>
            </h5>
            <p className="mt-1 mb-0">Welcome to your learning hub!</p>
          </div>
        </div>

        <div className="search">
          <input type="text" className="form-control w-100 border-0 bg-transparent" placeholder="Search here" />
          <i className="fa fa-search position-absolute d-block fs-6">🔍</i>
        </div>

        <ul className="categories">
          <li className={`has-dropdown ${activeSection === 'dashboard' ? 'active' : ''}`}>
            <i className="uil-estate fa-fw">🏠</i><a href="#" onClick={() => setActiveSection('dashboard')}> Dashboard</a>
          </li>
          <li className={`${activeSection === 'library' ? 'active' : ''}`}>
            <i className="uil-folder">📁</i><a href="#" onClick={() => setActiveSection('library')}> Library</a>
          </li>
          <li className={`has-dropdown ${activeSection === 'calendar' ? 'active' : ''}`}>
            <i className="uil-calendar-alt">📅</i><a href="#" onClick={() => setActiveSection('calendar')}> Calendar</a>
          </li>
          <li className="has-dropdown">
            <i className="uil-envelope-download fa-fw">📧</i><a href="#"> Mailbox</a>
          </li>
          <li className="has-dropdown">
            <i className="uil-shopping-cart-alt">🛒</i><a href="#"> Ecommerce</a>
          </li>
          <li className={`has-dropdown ${activeSection === 'projects' ? 'active' : ''}`}>
            <i className="uil-bag">💼</i><a href="#" onClick={() => setActiveSection('projects')}> Future Projects</a>
          </li>
          <li className="">
            <i className="uil-setting">⚙️</i><a href="#"> Settings</a>
          </li>
          <li className={`has-dropdown ${activeSection === 'tools' ? 'active' : ''}`}>
            <i className="uil-chart-pie-alt">📊</i><a href="#" onClick={() => setActiveSection('tools')}> Study Tools</a>
          </li>
          <li className={`has-dropdown ${activeSection === 'performance' ? 'active' : ''}`}>
            <i className="uil-panel-add">📈</i><a href="#" onClick={() => setActiveSection('performance')}> Your Study Performance</a>
          </li>
          <li className={`${activeSection === 'studies' ? 'active' : ''}`}>
            <i className="uil-map-marker">📍</i><a href="#" onClick={() => setActiveSection('studies')}> Your Studies</a>
          </li>
        </ul>
      </aside>

      <section id="wrapper" className="wrapper">
        <nav className="navbar navbar-expand-md">
          <div className="container-fluid mx-2">
            <div className="navbar-header">
              <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#toggle-navbar" aria-controls="toggle-navbar" aria-expanded="false" aria-label="Toggle navigation">
                <i className="uil-bars text-white">☰</i>
              </button>
              <a className="navbar-brand" href="#">Learning<span className="main-color">Central</span></a>
            </div>
            <div className="collapse navbar-collapse" id="toggle-navbar">
              <ul className="navbar-nav ms-auto">
                <li className="nav-item dropdown">
                  <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                    Settings
                  </a>
                  <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                    <li><a className="dropdown-item" href="#">My account</a></li>
                    <li><a className="dropdown-item" href="#">My inbox</a></li>
                    <li><a className="dropdown-item" href="#">Help</a></li>
                    <li><hr className="dropdown-divider" /></li>
                    <li><a className="dropdown-item" href="#">Log out</a></li>
                  </ul>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#"><i className="uil-comments-alt">💬</i><span>23</span></a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#"><i className="uil-bell">🔔</i><span>98</span></a>
                </li>
                <li className="nav-item">
                  <a className="nav-link" href="#">
                    <i data-show="show-side-navigation1" className="uil-bars show-side-btn">☰</i>
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        <div className="p-4">
          {activeSection === 'dashboard' && (
            <>
              <div className="welcome">
                <div className="content">
                  <h1 className="fs-3">Welcome to Learning Central</h1>
                  <p className="mb-0">Hello {user?.username || 'User'}, welcome to your learning hub!</p>
                </div>
              </div>

              <section className="statistics">
                <div className="row">
                  <div className="col-lg-4">
                    <div className="box d-flex rounded-2 align-items-center mb-4 mb-lg-0 p-3">
                      <i className="uil-envelope-shield fs-2 text-center bg-primary rounded-circle">📧</i>
                      <div className="ms-3">
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">1,245</h3> <span className="d-block ms-2">Emails</span>
                        </div>
                        <p className="fs-normal mb-0">Lorem ipsum dolor sit amet</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="box d-flex rounded-2 align-items-center mb-4 mb-lg-0 p-3">
                      <i className="uil-file fs-2 text-center bg-danger rounded-circle">📄</i>
                      <div className="ms-3">
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">34</h3> <span className="d-block ms-2">Projects</span>
                        </div>
                        <p className="fs-normal mb-0">Lorem ipsum dolor sit amet</p>
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="box d-flex rounded-2 align-items-center p-3">
                      <i className="uil-users-alt fs-2 text-center bg-success rounded-circle">👥</i>
                      <div className="ms-3">
                        <div className="d-flex align-items-center">
                          <h3 className="mb-0">5,245</h3> <span className="d-block ms-2">Users</span>
                        </div>
                        <p className="fs-normal mb-0">Lorem ipsum dolor sit amet</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="charts">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="chart-container">
                      <h3 className="fs-6 mb-3">Learning Progress</h3>
                      <canvas ref={chartRef1}></canvas>
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="chart-container">
                      <h3 className="fs-6 mb-3">Performance Metrics</h3>
                      <canvas ref={chartRef2}></canvas>
                    </div>
                  </div>
                </div>
              </section>

              <section className="admins">
                <div className="row">
                  <div className="col-md-6">
                    <div className="box">
                      <div className="admin d-flex align-items-center rounded-2 p-3 mb-4">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148906966/small/1501685402/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                      <div className="admin d-flex align-items-center rounded-2 p-3 mb-4">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907137/small/1501685404/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                      <div className="admin d-flex align-items-center rounded-2 p-3">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907019/small/1501685403/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="box">
                      <div className="admin d-flex align-items-center rounded-2 p-3 mb-4">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907114/small/1501685404/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                      <div className="admin d-flex align-items-center rounded-2 p-3 mb-4">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907086/small/1501685404/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                      <div className="admin d-flex align-items-center rounded-2 p-3">
                        <div className="img">
                          <img className="img-fluid rounded-pill"
                               width="75" height="75"
                               src="https://uniim1.shutterfly.com/ng/services/mediarender/THISLIFE/021036514417/media/23148907008/medium/1501685726/enhance"
                               alt="admin" />
                        </div>
                        <div className="ms-3">
                          <h3 className="fs-5 mb-1">Joge Lucky</h3>
                          <p className="mb-0">Lorem ipsum dolor sit amet consectetur elit.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section className="statis text-center">
                <div className="row">
                  <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
                    <div className="box bg-primary p-3">
                      <i className="uil-eye">👁️</i>
                      <h3>5,154</h3>
                      <p className="lead">Page views</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3 mb-4 mb-lg-0">
                    <div className="box bg-danger p-3">
                      <i className="uil-user">👤</i>
                      <h3>245</h3>
                      <p className="lead">User registered</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3 mb-4 mb-md-0">
                    <div className="box bg-warning p-3">
                      <i className="uil-shopping-cart">🛒</i>
                      <h3>5,154</h3>
                      <p className="lead">Product sales</p>
                    </div>
                  </div>
                  <div className="col-md-6 col-lg-3">
                    <div className="box bg-success p-3">
                      <i className="uil-feedback">💬</i>
                      <h3>5,154</h3>
                      <p className="lead">Transactions</p>
                    </div>
                  </div>
                </div>
              </section>

              <section className="charts">
                <div className="chart-container p-3">
                  <h3 className="fs-6 mb-3">Learning Growth</h3>
                  <div style={{ height: '300px' }}>
                    <canvas ref={chartRef3} width="100%"></canvas>
                  </div>
                </div>
              </section>
            </>
          )}

          {activeSection === 'calendar' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Calendar</h1>
                <p className="mb-0">Manage your study schedule and events</p>
              </div>
              <div style={{ marginTop: '1.5rem' }}>
                <Calendar onDateSelect={(date) => console.log('Selected date:', date)} />
              </div>
            </div>
          )}

          {activeSection === 'library' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Library</h1>
                <p className="mb-0">Access your learning resources and materials</p>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--dk-gray-300)' }}>
                <p>Library content coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Future Projects</h1>
                <p className="mb-0">Plan and track your upcoming learning projects</p>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--dk-gray-300)' }}>
                <p>Future projects content coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'tools' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Study Tools</h1>
                <p className="mb-0">Access various tools to enhance your learning experience</p>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--dk-gray-300)' }}>
                <p>Study tools content coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'performance' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Your Study Performance</h1>
                <p className="mb-0">Track your learning progress and achievements</p>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--dk-gray-300)' }}>
                <p>Performance tracking content coming soon...</p>
              </div>
            </div>
          )}

          {activeSection === 'studies' && (
            <div className="welcome">
              <div className="content">
                <h1 className="fs-3">Your Studies</h1>
                <p className="mb-0">Overview of your current and completed studies</p>
              </div>
              <div style={{ marginTop: '1.5rem', color: 'var(--dk-gray-300)' }}>
                <p>Studies overview content coming soon...</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardPage; 