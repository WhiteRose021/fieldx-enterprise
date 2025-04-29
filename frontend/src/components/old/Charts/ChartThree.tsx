// ChartThree.tsx
"use client";
import React from "react";
import dynamic from "next/dynamic";
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface ChartThreeProps {
  data: any;
}

const ChartThree: React.FC<ChartThreeProps> = ({ data }) => {
  const calculatePercentages = () => {
    const statuses = {
      'ΟΛΟΚΛΗΡΩΣΗ': 0,
      'ΑΠΟΣΤΟΛΗ': 0,
      'ΜΗ ΟΛΟΚΛΗΡΩΣΗ': 0,
      'ΑΠΟΡΡΙΨΗ': 0
    };

    data.list?.forEach(item => {
      if (statuses.hasOwnProperty(item.status)) {
        statuses[item.status]++;
      }
    });

    const total = Object.values(statuses).reduce((a, b) => a + b, 0);
    return Object.entries(statuses).map(([status, count]) => ({
      status,
      percentage: total > 0 ? ((count / total) * 100).toFixed(1) : '0'
    }));
  };

  const chartData = {
    series: calculatePercentages().map(item => parseFloat(item.percentage)),
    options: {
      chart: {
        type: 'donut',
        fontFamily: '"Satoshi", sans-serif',
      },
      labels: [
        'Ολοκληρωμένα',
        'Σε Εξέλιξη',
        'Μη Ολοκληρωμένα',
        'Απορριφθέντα'
      ],
      colors: ['#3C50E0', '#80CAEE', '#FF9800', '#DC3545'],
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '14px',
        fontFamily: '"Satoshi", sans-serif',
        labels: {
          colors: 'inherit',
          useSeriesColors: false
        },
        markers: {
          width: 12,
          height: 12,
          strokeWidth: 0,
          strokeColor: '#fff',
          radius: 12,
        },
        itemMargin: {
          horizontal: 8,
          vertical: 8
        }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Συνολικά',
                formatter: function (w) {
                  return data.list?.length || '0';
                }
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: '"Satoshi", sans-serif',
                color: '#111827',
                formatter: function (val) {
                  return val + '%';
                }
              }
            }
          }
        }
      },
      responsive: [{
        breakpoint: 480,
        options: {
          legend: {
            position: 'bottom'
          }
        }
      }],
      tooltip: {
        y: {
          formatter: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  return (
    <div>
      <div className="mb-4">
        <h4 className="text-xl font-bold text-black dark:text-white">
          Επισκόπηση Προόδου
        </h4>
        <div className="text-sm text-gray-500">
          Συνολική κατανομή καταστάσεων
        </div>
      </div>
      <div className="mt-6">
        <ReactApexChart
          options={chartData.options}
          series={chartData.series}
          type="donut"
          height={350}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        {calculatePercentages().map((item, index) => (
          <div key={index} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="text-sm text-gray-500">{item.status}</div>
            <div className="text-lg font-semibold">{item.percentage}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChartThree;