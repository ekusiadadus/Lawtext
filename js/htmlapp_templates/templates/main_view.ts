export const template = `

<style>
.lawtext-main-view {
}

.lawtext-main-view .lawtext-sidebar-container {
  position: fixed;
  width: 280px;
  top: 0;
  bottom: 0;
  left: 0;
  background-color: rgb(243, 243, 243);

  display: flex;
}

.lawtext-main-view .lawtext-htmlpreview-overlay {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 280px;
    z-index: 100;
}

.lawtext-main-view .lawtext-htmlpreview-container {
    margin-left: 280px;
}
</style>

<div class="lawtext-sidebar-container">
    <div class="lawtext-sidebar-view-place"></div>
</div>

<div class="lawtext-htmlpreview-container">
    <div class="lawtext-htmlpreview-view-place"></div>
</div>

<div class="modal fade" id="errorModal" tabindex="-1" role="dialog" aria-labelledby="errorModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title" id="errorModalLabel"></h5>
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">閉じる</button>
      </div>
    </div>
  </div>
</div>

`;