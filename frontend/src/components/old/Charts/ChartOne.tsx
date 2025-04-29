// ChartOne.tsx
import React from 'react';
import ReactApexChart from 'react-apexcharts';

const ChartOne = ({ data }) => {
  if (!data || !data.list) {
    return <div>No data available</div>;
  }

  // Count occurrences of each status
  const statusCounts = {
    'ΝΕΟ': data.list.filter(item => item.status === 'ΝΕΟ').length,
    'ΟΛΟΚΛΗΡΩΣΗ': data.list.filter(item => item.status === 'ΟΛΟΚΛΗΡΩΣΗ').length
  };

  const chartData = {
    series: [
      {
        name: 'Κατάσταση Εργασιών',
        data: [statusCounts['ΝΕΟ'], statusCounts['ΟΛΟΚΛΗΡΩΣΗ']]
      }
    ],
    options: {
      chart: {
        type: 'bar',
        height: 350,
        stacked: true,
        toolbar: {
          show: false
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
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          endingShape: 'rounded',
          borderRadius: 8,
        },
      },
      grid: {
        show: false,
        padding: {
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#3C50E0', '#80CAEE'],
      legend: {
        show: true,
        position: 'top',
        horizontalAlign: 'left',
        fontFamily: 'Satoshi',
        fontSize: '14px',
        fontWeight: 500,
        labels: {
          colors: ['#8A99AF'],
        },
        markers: {
          radius: 99,
        },
      },
      stroke: {
        colors: ['transparent'],
        width: 5,
        lineCap: 'round',
      },
      xaxis: {
        categories: ['ΝΕΟ', 'ΟΛΟΚΛΗΡΩΣΗ'],
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
        labels: {
          style: {
            colors: '#8A99AF',
            fontSize: '14px',
            fontFamily: 'Satoshi',
          },
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#8A99AF',
            fontSize: '14px',
            fontFamily: 'Satoshi',
          },
        },
      },
      responsive: [
        {
          breakpoint: 1024,
          options: {
            chart: {
              height: 300,
            },
          },
        },
        {
          breakpoint: 1366,
          options: {
            chart: {
              height: 350,
            },
          },
        },
      ],
      fill: {
        opacity: 1,
      },
      tooltip: {
        enabled: true,
        style: {
          fontSize: '14px',
          fontFamily: 'Satoshi',
        },
      },
    },
  };

  return (
    <div className="col-span-12 rounded-sm border border-stroke bg-white px-5 pb-5 pt-7.5 shadow-default dark:border-strokedark dark:bg-boxdark sm:px-7.5">
      <div className="mb-3 justify-between gap-4 sm:flex">
        <h4 className="text-xl font-semibold text-black dark:text-white">
          Κατανομή Εργασιών
        </h4>
      </div>

      <div>
        <div id="chartOne" className="-ml-5">
          <ReactApexChart
            options={chartData.options}
            series={chartData.series}
            type="bar"
            height={350}
          />
        </div>
      </div>
    </div>
  );
};

export default ChartOne;