import { Spinner } from "react-bootstrap"

const SuspenseLoader: React.FC = (): JSX.Element => (
  <div className="modal d-flex loader-l">
    <Spinner className="cls-spinner-box"
      animation="border"
    />
  </div>
)

export default SuspenseLoader