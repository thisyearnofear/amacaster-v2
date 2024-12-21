import { NextPage, NextPageContext } from 'next'
import Error from 'next/error'

interface ErrorProps {
  statusCode?: number
}

const MyError: NextPage<ErrorProps> = ({ statusCode }) => {
  return (
    <div>
      <h1>An Error Occurred</h1>
      {statusCode
        ? `An error ${statusCode} occurred on server`
        : 'An error occurred on client'}
    </div>
  )
}

MyError.getInitialProps = async ({
  res,
  err,
}: NextPageContext): Promise<ErrorProps> => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404
  return { statusCode }
}

export default MyError
