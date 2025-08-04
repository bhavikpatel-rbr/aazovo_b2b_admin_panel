import { getMenuRights } from '@/utils/getMenuRights'
import Board from './components/Board'

const ScrumBoard = () => <>
    {getMenuRights('task_board')?.is_view && <Board />}
</>

export default ScrumBoard
