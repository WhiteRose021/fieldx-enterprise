// ChartTwo.tsx
import React from 'react';
import ReactApexChart from 'react-apexcharts';

const ChartTwo = ({ data }) => {
  if (!data || !data.list) {
    return <div>No data available</div>;
  }

  // Process data to get monthly counts
  const monthlyData = data.list.reduce((acc, item) => {
    const date = new Date(item.createdAt);
    const monthYear = `${date.toLocaleString('default', { month: 'short' })} ${date.getFullYear()}`;
    
    if (!acc[monthYear]) {
      acc[monthYear] = {
        'ΝΕΟ': 0,
        'ΟΛΟΚΛΗΡΩΣΗ': 0
      };
    }
    
    if (item.status === 'ΝΕΟ' || item.status === 'ΟΛΟΚΛΗΡΩΣΗ') {
      acc[monthYear][item.status]++;
    }
    
    return acc;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });

  const chartData = {
    series: [
      {
        name: 'ΝΕΟ',
        data: sortedMonths.map(month => monthlyData[month]['ΝΕΟ'])
      },
      {
        name: 'ΟΛΟΚΛΗΡΩΣΗ',
        data: sortedMonths.map(month => monthlyData[month]['ΟΛΟΚΛΗΡΩΣΗ'])
      }
    ],
    options: {
      colors: ['#3C50E0', '#80CAEE'],
      chart: {
        fontFamily: 'Satoshi, sans-serif',
        type: 'area',
        height: 335,
        toolbar: {
          show: false,
        },
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.7,
          opacityTo: 0.2,
          stops: [0, 90, 100]
        }
      },
      stroke: {
        width: 2,
        curve: 'smooth'
      },
      markers: {
        size: 0,
        strokeColors: '#3056D3',
        strokeWidth: 3,
        strokeOpacity: 0.9,
        strokeDashArray: 0,
        fillOpacity: 1,
        discrete: [],
        hover: {
          size: 6,
          sizeOffset: 3
        }
      },
      grid: {
        show: true,
        borderColor: '#E2E8F0',
        strokeDashArray: 7,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0
        }
      },
      dataLabels: {
        enabled: false
      },
      xaxis: {
        categories: sortedMonths,
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false
        },
        labels: {
          style: {
            colors: '#64748B',
            fontSize: '14px',
            fontWeight: 500
          }
        }
      },
      yaxis: {
        title: {
          style: {
            fontSize: '14px',
            fontWeight: 500,
            colors: ['#64748B']
          }
        },
        labels: {
          style: {
            fontSize: '14px',
            fontWeight: 500,
            colors: ['#64748B']
          },
          formatter: function (value) {
            return Math.round(value);
          }
        }
      },
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontSize: '14px',
        fontWeight: 500,
        labels: {
          colors: ['#64748B']
        },
        markers: {
          radius: 99
        }
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontFamily: 'Satoshi'
        }
      }
    }
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pt-7.5 pb-5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <div>
          <h5 className="text-xl font-semibold text-black dark:text-white">
            Χρονική Εξέλιξη
          </h5>
        </div>
      </div>

      <div>
        <div id="chartTwo" className="-ml-5">
          <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="area"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartTwo;