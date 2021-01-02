package udptransport2_test

import (
	"net"
	"sync"
	"testing"
	"time"

	"github.com/peer-calls/peer-calls/server/sfu"
	"github.com/peer-calls/peer-calls/server/test"
	"github.com/peer-calls/peer-calls/server/transport"
	"github.com/peer-calls/peer-calls/server/udptransport2"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/goleak"
)

func listenUDP(laddr *net.UDPAddr) *net.UDPConn {
	conn, err := net.ListenUDP("udp", laddr)
	if err != nil {
		panic(err)
	}

	return conn
}

// func waitForResponse(req *udptransport2.Request, timeout time.Duration) (*udptransport2.Transport, error) {
// 	var (
// 		transport *udptransport2.Transport
// 		err       error
// 	)

// 	timer := time.NewTimer(20 * time.Second)
// 	defer timer.Stop()

// 	select {
// 	case res := <-req.Response():
// 		transport = res.Transport
// 		err = res.Err
// 	case <-timer.C:
// 		err = errors.Errorf("timed out waiting for transport")
// 	}

// 	return transport, errors.Trace(err)
// }

func TestManager_RTP(t *testing.T) {
	goleak.VerifyNone(t)
	defer goleak.VerifyNone(t)

	log := test.NewLogger()

	udpConn1 := listenUDP(&net.UDPAddr{
		IP:   net.IP{127, 0, 0, 1},
		Port: 0,
		Zone: "",
	})
	defer udpConn1.Close()

	udpConn2 := listenUDP(&net.UDPAddr{
		IP:   net.IP{127, 0, 0, 1},
		Port: 0,
		Zone: "",
	})
	defer udpConn2.Close()

	var f1, f2 *udptransport2.Factory

	tm1 := udptransport2.NewManager(udptransport2.ManagerParams{
		Conn: udpConn1,
		Log:  log,
	})
	defer tm1.Close()

	tm2 := udptransport2.NewManager(udptransport2.ManagerParams{
		Conn: udpConn2,
		Log:  log,
	})
	defer tm2.Close()

	track := sfu.NewUserTrack(
		transport.NewSimpleTrack(8, 1, "a", "aa"),
		"user1",
		"test-stream",
	)

	var wg sync.WaitGroup

	wg.Add(2)

	var transport1, transport2 *udptransport2.Transport

	go func() {
		defer wg.Done()

		f1 = <-tm1.FactoriesChannel()

		transport1 = <-f1.TransportsChannel()

		assert.Equal(t, "test-stream", transport1.StreamID)

		select {
		case event := <-transport1.TrackEventsChannel():
			assert.Equal(t, uint8(8), event.TrackInfo.Track.PayloadType())
			assert.Equal(t, uint32(1), event.TrackInfo.Track.SSRC())
			assert.Equal(t, transport.TrackEventTypeAdd, event.Type)
		case <-time.After(time.Second):
			assert.Fail(t, "Timed out waiting for rtp.Packet")
		}
	}()

	go func() {
		defer wg.Done()

		var err error

		f2, err = tm2.GetFactory(udpConn1.LocalAddr())
		require.NoError(t, err)

		transport2, err = f2.NewTransport("test-stream")
		require.NoError(t, err)

		err = transport2.AddTrack(track)
		require.NoError(t, err, "failed to add track")
	}()

	wg.Wait()

	assert.NoError(t, transport1.Close())
	assert.NoError(t, transport2.Close())

	// f1.Close()
	// f2.Close()
}

// func TestManager_NewTransport_Cancel(t *testing.T) {
// 	goleak.VerifyNone(t)
// 	defer goleak.VerifyNone(t)

// 	log := test.NewLogger()

// 	udpConn1 := listenUDP(&net.UDPAddr{
// 		IP:   net.IP{127, 0, 0, 1},
// 		Port: 0,
// 		Zone: "",
// 	})
// 	defer udpConn1.Close()

// 	tm1 := udptransport2.NewManager(udptransport2.ManagerParams{
// 		Conn: udpConn1,
// 		Log:  log,
// 	})
// 	defer tm1.Close()

// 	var err error
// 	f2, err := tm1.GetFactory(udpConn1.LocalAddr())
// 	require.NoError(t, err)

// 	transport, err := f2.NewTransport("test-stream")
// 	require.NoError(t, err, "creating transport")

// 	var wg sync.WaitGroup

// 	wg.Add(1)

// 	go func() {
// 		defer wg.Done()

// 		transport, err := waitForResponse(req, 20*time.Second)
// 		_, _ = transport, err
// 		// Do not assert here because a test might fail if a transport is created
// 		// before Cancel is called. Rare, but happens.
// 		// require.Equal(t, udptransport2.ErrCanceled, err)
// 		// require.Nil(t, transport)
// 	}()

// 	// req.Cancel()

// 	wg.Wait()
// }
