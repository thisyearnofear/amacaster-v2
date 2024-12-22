import ProfileClient from '../../components/ProfileClient'

export default async function ProfilePage({
  params,
}: {
  params: { fid: string }
}) {
  return (
    <main>
      <ProfileClient fid={params.fid} />
    </main>
  )
}
