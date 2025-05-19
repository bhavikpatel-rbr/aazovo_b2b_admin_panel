import AdaptiveCard from '@/components/shared/AdaptiveCard'
import Container from '@/components/shared/Container'
import FormListActionTools from './components/FormBuilderActionTools'
import FormListSelected from './components/FormListSelected'
import FormListTable from './components/FormListTable'
import FormListTableTools from './components/FormListTableTools'

const AllDocuments = () => {
    
    return (
        <>
            <Container>
                <AdaptiveCard>
                    <div className="flex flex-col gap-4">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                            <h5>Document Master</h5>
                            <FormListActionTools />
                        </div>
                        <FormListTableTools />
                        <FormListTable />
                    </div>
                </AdaptiveCard>
            </Container>
            <FormListSelected />
        </>
    )
}

export default AllDocuments
