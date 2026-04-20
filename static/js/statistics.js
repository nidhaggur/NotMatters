// 配置Chart.js默认选项
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
Chart.defaults.color = '#6c757d';

// 任务状态分布数据
const statusData = status_data;
const statusCtx = document.getElementById('statusChart').getContext('2d');
new Chart(statusCtx, {
    type: 'doughnut',
    data: {
        labels: ['待办', '进行中', '已完成'],
        datasets: [{
            data: [statusData.pending, statusData.in_progress, statusData.completed],
            backgroundColor: ['#ffc107', '#0dcaf0', '#198754'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 20,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        cutout: '60%'
    }
});

// 优先级分布数据
const priorityData = priority_data;
const priorityCtx = document.getElementById('priorityChart').getContext('2d');
new Chart(priorityCtx, {
    type: 'bar',
    data: {
        labels: ['高', '中', '低'],
        datasets: [{
            label: '任务数量',
            data: [priorityData.high, priorityData.medium, priorityData.low],
            backgroundColor: ['#dc3545', '#ffc107', '#198754'],
            borderRadius: 8,
            borderSkipped: false
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
                ticks: {
                    stepSize: 1,
                    padding: 10
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
});

// 任务创建趋势数据
const trendData = trend_data;
const trendCtx = document.getElementById('trendChart').getContext('2d');
new Chart(trendCtx, {
    type: 'line',
    data: {
        labels: trendData.labels,
        datasets: [{
            label: '创建任务数',
            data: trendData.data,
            borderColor: '#0d6efd',
            backgroundColor: 'rgba(13, 110, 253, 0.1)',
            tension: 0.4,
            fill: true,
            pointRadius: 4,
            pointHoverRadius: 6,
            pointBackgroundColor: '#0d6efd',
            pointBorderColor: '#fff',
            pointBorderWidth: 2
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
                ticks: {
                    stepSize: 1,
                    padding: 10
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                },
                ticks: {
                    maxTicksLimit: 10
                }
            }
        }
    }
});

// 标签分布数据
const tagData = tag_data;
const tagCtx = document.getElementById('tagChart').getContext('2d');
new Chart(tagCtx, {
    type: 'doughnut',
    data: {
        labels: tagData.labels,
        datasets: [{
            data: tagData.data,
            backgroundColor: [
                '#0d6efd', '#198754', '#ffc107', '#dc3545', 
                '#0dcaf0', '#6c757d', '#fd7e14', '#d63384'
            ],
            borderWidth: 0,
            hoverOffset: 4
        }]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    padding: 15,
                    usePointStyle: true,
                    pointStyle: 'circle'
                }
            }
        },
        cutout: '50%'
    }
});

// 每日完成数数据
const dailyData = daily_data;
const dailyCtx = document.getElementById('dailyChart').getContext('2d');
new Chart(dailyCtx, {
    type: 'bar',
    data: {
        labels: dailyData.labels,
        datasets: [{
            label: '完成任务数',
            data: dailyData.data,
            backgroundColor: '#198754',
            borderRadius: 6,
            borderSkipped: false
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
                ticks: {
                    stepSize: 1,
                    padding: 10
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.05)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        }
    }
});
