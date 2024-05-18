import React, { useEffect, useState } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ChartData,
    ArcElement,
} from 'chart.js';
import { Doughnut, Line, Pie } from 'react-chartjs-2';
import { ILineData } from '../../models';
import { pickClosable } from 'antd/es/_util/hooks/useClosable';

ChartJS.register(ArcElement, Tooltip, Legend);

export const options = {
    responsive: true,
    plugins: {
        legend: {
            position: 'bottom' as const,
        },
        title: {
            display: false,
        },
    },
};


const emptyData: ChartData<"doughnut", number[], string> = {
    labels: [],
    datasets: []
};


export default function PieChart({ lineData, dataTitle }: { lineData: ILineData, dataTitle: string }) {

    const [dataChart, setDataChart] = useState<ChartData<"doughnut", number[], string>>(emptyData);
    console.log('pie', lineData)

    useEffect(() => {
        const labels = lineData.labels;

        const data = {
            labels,
            datasets: [
                {
                    label: dataTitle,
                    data: lineData.data,
                    borderColor: ['#AF91C1', '#7AC5B0', '#7A8AC5'],
                    backgroundColor: ['#AF91C1', '#7AC5B0', '#7A8AC5'],
                },
            ],
        }

        setDataChart(data)

    }, [lineData])




    return <Doughnut options={options} data={dataChart} />;
}