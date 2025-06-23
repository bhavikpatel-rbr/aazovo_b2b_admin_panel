import type { Ticket } from './types'

export const createUID = (len: number) => {
    const buf = [],
        chars =
            'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
        charlen = chars.length,
        length = len || 32

    for (let i = 0; i < length; i++) {
        buf[i] = chars.charAt(Math.floor(Math.random() * charlen))
    }
    return buf.join('')
}

export const createCardObject = (): Ticket => {
    return {
        id: createUID(10),
        name: 'Untitled Card',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
        cover: '',
        members: [],
        labels: ['New'],
        attachments: [],
        comments: [],
        dueDate: null,
    }
}

export const taskLabelColors: Record<string, string> = {
    'Pending': 'bg-yellow-500 text-white',
    'In Progress': 'bg-blue-500 text-white', // Example, adjust if your API uses different terms
    'Completed': 'bg-green-500 text-white',
    'Done': 'bg-green-600 text-white', // If "Done" is a status
    'To Do': 'bg-gray-500 text-white', // If "To Do" is a status
    'Review': 'bg-purple-500 text-white',
    'On Hold': 'bg-orange-400 text-black',


    // Priorities from API
    'High': 'bg-red-600 text-white',
    'Medium': 'bg-orange-500 text-white',
    'Low': 'bg-teal-500 text-white',
    'Urgent': 'bg-pink-600 text-white',

    // Other generic labels (if any)
    'Bug': 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-100',
    'Feature': 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-100',
    'Improvement': 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-100',
}

export const labelList = ['Task', 'Bug', 'Live issue', 'Low priority']
